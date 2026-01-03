"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useRef, useState } from "react";
import { useEffect } from "react";

const page = () => {
  const [message, setMessage] = useState<string>("");

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | undefined>(undefined);

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
      channel.current = e.channel;
      channel.current.onopen = () => {
        console.log("data channel open");
      };
      channel.current.onmessage = (e) => console.log("P2P message:", e.data);
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

  const send = () => {
    console.log("ready-state", ws.current?.readyState);
    // if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    //   ws.current.send(message);
    // }
    if (channel.current && channel.current.readyState === "open") {
      channel.current.send(message);
    }
  };

  return (
    <div className=" h-screen w-full flex justify-center items-center">
      <div className=" w-md">
        <Input
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          placeholder="Type here..."
        />
        <Button onClick={send} className="mt-1">
          Enter
        </Button>
        <Button onClick={offer} className="mt-1">
          Send offer
        </Button>
      </div>
    </div>
  );
};

export default page;
