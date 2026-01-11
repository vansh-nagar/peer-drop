"use client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { RotateCcw, Send } from "lucide-react";
import { wsRtcConnectionHook } from "@/hooks/ws-rtc-connection";
import { useParams } from "next/navigation";
import RainBowBar from "@/components/mine/rainbow-bar";
import { LightDarkMode } from "@/components/mine/light-dark-mode";

const Page = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const {
    message,
    setMessage,
    offer,
    send,
    File,
    setFile,
    Image,
    uploadedSize,
    totalSize,
  } = wsRtcConnectionHook({ roomId: id });

  console.log(id);
  return (
    <div className=" h-screen w-full flex justify-center items-center p-3">
      <div className=" fixed top-4 right-4 flex gap-3 flex-col">
        <LightDarkMode />
        <Button
          size={"icon"}
          variant={"outline"}
          onClick={() => {
            window.location.reload();
          }}
          className=" border-dashed rounded-none"
        >
          <RotateCcw />
        </Button>
      </div>
      <div className="max-w-md w-full flex flex-col gap-2">
        <div className="aspect-square flex justify-center">
          {Image && (
            <img src={Image} className="w-full object-contain" alt="recived" />
          )}
        </div>
        <FileUpload onChange={setFile} />

        <div className="flex items-center gap-3">
          <Button
            onClick={(e) => {
              e.preventDefault();

              send();
            }}
            type="submit"
            size={"icon"}
          >
            <Send />
          </Button>
          <Button onClick={offer} variant={"outline"} className="">
            Send offer
          </Button>
        </div>

        <div className="h-2 w-full overflow-hidden  bg-muted rounded-full">
          <RainBowBar
            style={{ width: `${(uploadedSize / totalSize) * 100}%` }}
            className={`rounded-full blur-xs `}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
