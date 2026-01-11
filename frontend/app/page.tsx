"use client";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Button
        onClick={() => {
          router.push(`/room/${nanoid()}`);
        }}
      >
        Create Room
      </Button>{" "}
    </div>
  );
};

export default Page;
