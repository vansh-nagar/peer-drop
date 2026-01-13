import { useInstantTransition } from "motion/react";
import { useState, useRef, useEffect } from "react";

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
  const [ack, setAck] = useState(false);

  const MAX_MEMORY = 8 * 1024 * 1024;
  const MIN_MEMORY = 2 * 1024 * 1024;

  useEffect(() => {
    setInterval(() => {
      setUploadedSize(updatedUploadedSize.current);
    }, 50);
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
      if (roomId) ws.current?.send(JSON.stringify({ type: "join", roomId }));
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
          JSON.stringify({ type: "candidate", candidate: e.candidate, roomId })
        );
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

            setAck(true);
            channel.current?.send("ACK");

            console.log("setting ack to true :)");
            setTimeout(() => {
              setAck(false);
            }, 5000);

            return;
          }

          return;
        }

        const byte = new Uint8Array(e.data);
        recivedData.current.push(byte);
        reciveSize += byte.length;

        if (reciveSize > MAX_MEMORY) {
          channel.current?.send("PAUSE");
          await pause();
          channel.current?.send("CONTINUE");
        }
        console.log(byte);
      };
    };

    ws.current.onmessage = async (message) => {
      console.log("WebSocket message received:", message.data);
      const data = JSON.parse(message.data);
      if (data.type === "offer") {
        pc.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
        await answer();
      }
      if (data.type === "answer") {
        pc.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
      if (data.type === "candidate") {
        pc.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
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
        if (e.data === "PAUSE") {
          PAUSE_STREAMING.current = true;
          console.log("PAUSEEEEEEEEEEEEEEEEEE");
        }
        if (e.data === "CONTINUE") {
          PAUSE_STREAMING.current = false;
          console.log("CONTINUEEEEEEEEEEEEEE");
        }
        if (e.data === "ACK") {
          console.log("setting ack to true :)");
          setAck(true);
          setTimeout(() => {
            setAck(false);
          }, 5000);
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
    pc.current?.setLocalDescription(ans);

    if (ws.current)
      ws.current.send(JSON.stringify({ type: "answer", answer: ans, roomId }));
  };

  const pauseTillStreamTrue = async () => {
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

    for (let i = 0; i <= bytes.length; i += CHUNK_SIZE) {
      if (PAUSE_STREAMING.current === true) await pauseTillStreamTrue();

      channel.current?.send(bytes.slice(i, i + CHUNK_SIZE));
      console.log(bytes.slice(i, i + CHUNK_SIZE));
      updatedUploadedSize.current += CHUNK_SIZE;
      console.log("BUFFER MEMORY: ", channel.current?.bufferedAmount);
      if (channel.current?.bufferedAmount! > MAX_MEMORY) {
        await pause();
      }
    }
    channel.current?.send("EOF");
  };

  return {
    message,
    setMessage,
    offer,
    send,
    File,
    setFile,
    Image,
    uploadedSize,
    totalSize,
    ack,
    setUploadedSize,
    setTotalSize,
    updatedUploadedSize,
  };
};
