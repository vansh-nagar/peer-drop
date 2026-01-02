"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useRef, useState } from "react";
import { useEffect } from "react";

const page = () => {
  const [message, setMessage] = useState<string>("");

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      console.log("WebSocket Client Connected");
    };
    ws.current.onmessage = (message) => {
      console.log("Received message:", message.data);
    };
  }, []);

  const send = () => {
    if (!ws.current) return;

    ws.current.send(message);
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
        <Button className="mt-1">Enter</Button>
      </div>
    </div>
  );
};

export default page;
