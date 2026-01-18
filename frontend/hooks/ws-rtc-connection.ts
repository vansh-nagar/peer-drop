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

  const MAX_MEMORY = 80 * 1024 * 1024;
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

    let reciveSize = 0;

    pc.current.ondatachannel = (e) => {
      channel.current = e.channel;
      channel.current.binaryType = "arraybuffer";
      channel.current.onopen = () => {
        console.log("data channel open");
      };
      channel.current.onmessage = async (e) => {
        console.log("P2P message received", e.data);
        if (typeof e.data === "string") {
          if (e.data === "EOF") {
            console.log("EOFFFFFFFFF agaya bc");
            console.log(recivedData.current);
            let offset = 0;
            let finalFile = new Uint8Array(reciveSize);
            for (const chunk of recivedData.current) {
              finalFile.set(chunk, offset);
              offset += chunk.length;
            }
            const blob = new Blob([finalFile], { type: "image/png" });
            const url = URL.createObjectURL(blob);
            setImage(url);

            reciveSize = 0;
            recivedData.current = [];
            return;
          }
        }

        const byte = new Uint8Array(e.data);
        recivedData.current.push(byte);
        reciveSize += byte.length;

        channel.current?.send("ACK");

        console.log(byte);
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
    channel.current.onopen = () => {
      console.log("data channel open");
    };

    channel.current.onmessage = (e) => {
      if (typeof e.data === "string") {
        if (e.data === "ACK") {
          console.log("ACK CAME CONTINUING");
          inFlightChunk.current = Math.max(0, inFlightChunk.current - 1);
        }
      }
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
    const file = File![0];
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 256 * 1024;
    setTotalSize(bytes.length);

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      if (PAUSE_STREAMING.current === true) await pauseTillStreamFalse();

      while (inFlightChunk.current >= ACK_WINDOW) {
        await new Promise<void>((r) => setTimeout(r, 50));
      }

      if (channel.current?.bufferedAmount! > MAX_MEMORY) await pause();
      channel.current?.send(bytes.slice(i, i + CHUNK_SIZE));
      inFlightChunk.current++;

      updatedUploadedSize.current += CHUNK_SIZE;
    }
    channel.current?.send("EOF");
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
  };
};
