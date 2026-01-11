"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
  const router = useRouter();
  const [input, setInput] = useState("");

  return (
    <div className="h-screen w-full flex flex-col gap-3 justify-center items-center">
      <div className="max-w-md w-full flex flex-col gap-3 p-3">
        <Button
          onClick={() => {
            router.push(`/room/${nanoid()}`);
          }}
        >
          Create Room
        </Button>{" "}
        <div className="flex gap-3 ">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="Enter Room ID"
          />
          <Button
            onClick={() => {
              router.push(`/room/${input}`);
            }}
          >
            Join Room
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
