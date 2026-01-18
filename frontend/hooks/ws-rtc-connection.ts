import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export const wsRtcConnectionHook = ({ roomId }: { roomId: string }) => {
  const [message, setMessage] = useState<string>("");

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | undefined>(undefined);
  const recivedData = useRef<Uint8Array[]>([]);
  const [File, setFile] = useState<File[] | null>(null);
  const [Image, setImage] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(10);
  const updatedUploadedSize = useRef(0);
  const PAUSE_STREAMING = useRef(false);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const reciverSize = useRef(0);
  const fileNameRef = useRef("");

  const [sendingFile, setSendingFile] = useState(false);

  const localVideoStream = useRef<HTMLVideoElement | null>(null);

  const remoteVideoStream = useRef<HTMLVideoElement | null>(null);

  const localStreams = useRef<MediaStream | null>(null);
  const remoteStreams = useRef<MediaStream | null>(null);

  const MAX_MEMORY = 8 * 1024 * 1024;
  const MIN_MEMORY = 2 * 1024 * 1024;
  const ACK_WINDOW = 32;

  const inFlightChunk = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setUploadedSize(updatedUploadedSize.current);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const pause = async () => {
    console.log("PAUSING FOR MEMORY TO DRAIN");
    await new Promise<void>((resolve) => {
      const check = () => {
        if (channel.current?.bufferedAmount! < MIN_MEMORY) {
          resolve();
        } else {
          setTimeout(() => {
            check();
          }, 50);
        }
      };
      check();
    });
  };

  const onMessageHandler = (e: any) => {
    if (typeof e.data === "string") {
      if (e.data === "ACK") {
        inFlightChunk.current = Math.max(0, inFlightChunk.current - 1);
      }
      if (e.data.startsWith("SIZE/")) {
        const sizeStr = e.data.split("/");
        // setTotalSize(Number(sizeStr[1]));
      }

      if (e.data.startsWith("EOF/")) {
        const fileName = e.data.split("/");
        fileNameRef.current = fileName[1];
        let offset = 0;
        let finalFile = new Uint8Array(reciverSize.current);
        for (const chunk of recivedData.current) {
          finalFile.set(chunk, offset);
          offset += chunk.length;
        }
        const blob = new Blob([finalFile], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        setImage(url);

        reciverSize.current = 0;
        recivedData.current = [];

        return;
      }
    }

    const byte = new Uint8Array(e.data);
    recivedData.current.push(byte);
    reciverSize.current += byte.length;

    channel.current?.send("ACK");

    // console.log(byte);
  };

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.onopen = () => {
      if (roomId && ws.current?.readyState === WebSocket.OPEN)
        ws.current?.send(JSON.stringify({ type: "join", roomId }));
    };

    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:your-turn-server.com",
          username: "user",
          credential: "pass",
        },
      ],
    });

    pc.current.onicecandidate = (e) => {
      if (e.candidate && ws.current) {
        ws.current.send(
          JSON.stringify({ type: "candidate", candidate: e.candidate, roomId }),
        );
      }
    };

    pc.current.onconnectionstatechange = () => {
      const state = pc.current?.connectionState;
      toast.message(`${pc.current?.connectionState}`);

      if (state === "failed" || state === "closed") {
        pc.current?.close();

        pc.current?.getSenders().forEach((sender) => {
          pc.current?.removeTrack(sender);
        });
      }
    };

    pc.current.ontrack = async (e) => {
      console.log("Remote track received", e.streams);
      const remoteStream = e.streams[0];
      remoteStreams.current = remoteStream;

      if (remoteVideoStream.current) {
        remoteVideoStream.current.srcObject = remoteStream;
      }

      if (remoteStreams.current) {
      }
    };

    pc.current.ondatachannel = (e) => {
      channel.current = e.channel;
      channel.current.binaryType = "arraybuffer";
      channel.current.onopen = () => {
        console.log("data channel open");
      };
      channel.current.onmessage = async (e) => {
        onMessageHandler(e);
      };
      channel.current.bufferedAmountLowThreshold = MIN_MEMORY;
      channel.current.onbufferedamountlow = () => {
        console.log("BUFFERED AMOUNT LOW TRIGGERED");
        PAUSE_STREAMING.current = false;
      };
    };

    ws.current.onmessage = async (message) => {
      console.log("WebSocket message received:", message.data);
      const data = JSON.parse(message.data);
      if (data.type === "offer") {
        await pc.current?.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );
        await answer();
      }
      if (data.type === "answer") {
        await pc.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
      }
      if (data.type === "candidate") {
        await pc.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
      if (data.type === "toast") {
        toast.message(`${data.message}`);
      }
      if (data.type === "send-offer") {
        await offer();
      }
      if (data.type === "user-count") {
        setTotalUserCount(data.count);
      }
    };
  }, []);

  const offer = async () => {
    channel.current = pc.current?.createDataChannel("data-transfer");
    if (channel.current) channel.current.binaryType = "arraybuffer";
    if (!channel.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreams.current = stream;

    stream.getTracks().forEach((track) => {
      track.enabled = false;
      pc.current?.addTrack(track, stream);
    });

    if (localVideoStream.current) {
      localVideoStream.current.srcObject = stream;
    }

    channel.current.onopen = () => {
      console.log("data channel open");
    };

    channel.current.onmessage = (e) => {
      onMessageHandler(e);
    };

    if (!pc.current) return;
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    if (offer && ws.current) {
      ws.current.send(JSON.stringify({ type: "offer", offer: offer, roomId }));
    }
  };

  const answer = async () => {
    if (!pc.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    stream.getTracks().forEach((track) => {
      track.enabled = false;
      pc.current?.addTrack(track, stream);
    });

    if (localVideoStream.current) {
      localVideoStream.current.srcObject = stream;
    }

    localStreams.current = stream;

    const ans = await pc.current?.createAnswer();
    await pc.current?.setLocalDescription(ans);

    if (ws.current)
      ws.current.send(JSON.stringify({ type: "answer", answer: ans, roomId }));
  };

  const pauseTillStreamFalse = async () => {
    await new Promise<void>((r) => {
      const check = () => {
        if (PAUSE_STREAMING.current === false) {
          r();
        } else {
          setTimeout(() => {
            check();
          }, 50);
        }
      };
      check();
    });
  };

  const send = async () => {
    setSendingFile(true);
    const file = File![0];
    console.log("Sending file:", file.type);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 256 * 1024;
    setTotalSize(bytes.length);

    channel.current?.send(`SIZE/${bytes.length}`);

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      if (PAUSE_STREAMING.current === true) await pauseTillStreamFalse();
      if (channel.current?.bufferedAmount! > MAX_MEMORY) await pause();

      while (inFlightChunk.current >= ACK_WINDOW) {
        await new Promise<void>((r) => setTimeout(r, 50));
      }

      channel.current?.send(bytes.slice(i, i + CHUNK_SIZE));
      inFlightChunk.current++;

      updatedUploadedSize.current += CHUNK_SIZE;
    }
    channel.current?.send(`EOF/${file.name}`);
    setSendingFile(false);
    return;
  };

  return {
    message,
    setMessage,
    send,
    File,
    setFile,
    Image,
    uploadedSize,
    totalSize,
    setUploadedSize,
    setTotalSize,
    updatedUploadedSize,
    totalUserCount,
    pc,
    remoteVideoStream,
    offer,
    localVideoStream,
    localStreams,
    remoteStreams,
    sendingFile,
    fileNameRef,
  };
};
