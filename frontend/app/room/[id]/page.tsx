"use client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { wsRtcConnectionHook } from "@/hooks/ws-rtc-connection";

const Page = ({ id }: { id: string }) => {
  const { message, setMessage, offer, send, File, setFile, Image } =
    wsRtcConnectionHook();
  return (
    <div className=" h-screen w-full flex justify-center items-center p-3">
      <div className=" min-w-md flex flex-col gap-2">
        {Image && <img src={Image} alt="recived" />}
        <FileUpload onChange={setFile} />
        <form
          onSubmit={(e) => {
            e.preventDefault();

            send();
          }}
          className=" flex  justify-center items-center  gap-2"
        >
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            placeholder="Type here..."
          />
          <Button type="submit" size={"icon"} className="mt-1">
            <Send />
          </Button>
        </form>
        <Button onClick={offer} variant={"outline"} className="mt-1">
          Send offer
        </Button>
      </div>
    </div>
  );
};

export default Page;
