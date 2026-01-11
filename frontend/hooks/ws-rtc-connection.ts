import { useState, useRef, useEffect } from "react";

export const wsRtcConnectionHook = ({ roomId }: { roomId: string }) => {
  const [message, setMessage] = useState<string>("");

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | undefined>(undefined);
  const recivedData = useRef<Uint8Array[]>([]);
  const [File, setFile] = useState<File[] | null>(null);
  const [Image, setImage] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(10);
  const [uploadedSize, setUploadedSize] = useState(0);

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
      console.log("hello");
      channel.current = e.channel;
      channel.current.binaryType = "arraybuffer";
      channel.current.onopen = () => {
        console.log("data channel open");
      };
      channel.current.onmessage = (e) => {
        if (typeof e.data === "string" && e.data === "EOF") {
          const finalData = new Uint8Array(reciveSize);
          let offset = 0;

          for (const c of recivedData.current) {
            finalData.set(c, offset);
            offset += c.length;
          }

          const blob = new Blob([finalData]);
          setImage(URL.createObjectURL(blob));
          recivedData.current = [];
          reciveSize = 0;

          return;
        }

        const data = new Uint8Array(e.data);
        recivedData.current.push(data);
        reciveSize += data.length;
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
    channel.current.onmessage = (e) => console.log("P2P message:", e.data);

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

  const send = async () => {
    console.log("ready-state", ws.current?.readyState);
    if (channel.current && channel.current.readyState === "open") {
      const CHUNK_SIZE = 16 * 1024;
      const file = File?.[0];
      const buffer = await file?.arrayBuffer();
      const bytes = new Uint8Array(buffer!); // bytes are managable not buffer

      setTotalSize(bytes.length);
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        setUploadedSize((prev) => prev + chunk.length);
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        channel.current.send(chunk);
      }

      channel.current.send("EOF");

      console.log(bytes);
    }

    setMessage("");
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
  };
};
