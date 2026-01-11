import { useState, useRef, useEffect } from "react";

export const wsRtcConnectionHook = () => {
  const [message, setMessage] = useState<string>("");

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | undefined>(undefined);
  const [File, setFile] = useState<File[] | null>(null);
  const [Image, setImage] = useState<string | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.onopen = () => {
      console.log("WebSocket Client Connected");
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
          JSON.stringify({ type: "candidate", candidate: e.candidate })
        );
      }
    };

    pc.current.ondatachannel = (e) => {
      console.log("hello");
      channel.current = e.channel;
      channel.current.binaryType = "arraybuffer";
      channel.current.onopen = () => {
        console.log("data channel open");
      };
      channel.current.onmessage = (e) => {
        const recivedData = new Uint8Array(e.data);
        console.log("hello");
        console.log("P2P message as bytes:", recivedData);

        const blob = new Blob([recivedData]);
        console.log("File Blob:", blob);
        const url = URL.createObjectURL(blob);
        console.log("File URL:", url);
        setImage(url);
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
      ws.current.send(JSON.stringify({ type: "offer", offer: offer }));
    }
  };

  const answer = async () => {
    if (!pc.current) return;
    const ans = await pc.current?.createAnswer();
    pc.current?.setLocalDescription(ans);

    if (ws.current)
      ws.current.send(JSON.stringify({ type: "answer", answer: ans }));
  };

  const send = async () => {
    console.log("ready-state", ws.current?.readyState);
    // if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    //   ws.current.send(message);
    // }
    if (channel.current && channel.current.readyState === "open") {
      // channel.current.send(message);

      if (!File) return;
      const file = File?.[0];
      const arrayBuffer = await file?.arrayBuffer(); //raw array buffer
      const bytes = new Uint8Array(arrayBuffer!); //array buffer converted into bytes
      //readable + controllable bytes You can send ArrayBuffer, but you can’t control it without bytes.
      console.log("bytes", bytes);

      channel.current.send(bytes);
    }

    setMessage("");
  };

  return { message, setMessage, offer, send, File, setFile, Image };
};
