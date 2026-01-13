"use client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { RotateCcw, Send } from "lucide-react";
import { wsRtcConnectionHook } from "@/hooks/ws-rtc-connection";
import { useParams } from "next/navigation";
import RainBowBar from "@/components/mine/rainbow-bar";
import { LightDarkMode } from "@/components/mine/light-dark-mode";
import { toast } from "sonner";

const Page = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const {
    offer,
    send,
    setFile,
    Image,
    uploadedSize,
    setUploadedSize,
    totalSize,
    ack,
    setTotalSize,
    File,
    updatedUploadedSize,
  } = wsRtcConnectionHook({ roomId: id });

  console.log(id);
  return (
    <div className=" w-full flex justify-center items-center p-3">
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
      <div className="max-w-md w-full flex flex-col justify-center  gap-2">
        <div className=" flex justify-center w-full h-40 aspect-square border">
          {Image && (
            <img src={Image} className="w-full object-contain" alt="recived" />
          )}
          <div className="flex flex-col">
            {Image && (
              <video
                autoPlay
                muted
                loop
                src={Image}
                className="w-full object-contain"
              />
            )}
            <a href={Image || ""} download={true}>
              <Button size={"sm"}>Download</Button>
            </a>
          </div>
        </div>
        <FileUpload onChange={setFile} />
        <div className="flex items-center gap-3">
          <Button
            onClick={(e) => {
              if (!File?.length) return toast.error("Please enter a file");
              e.preventDefault();
              setUploadedSize(10);
              setTotalSize(0);
              updatedUploadedSize.current = 0;
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
          <div
            className={`rounded-full border ${
              ack ? "bg-green-400" : "bg-red-500 "
            } h-2 aspect-square`}
          ></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-full overflow-hidden bg-muted rounded-full">
            <RainBowBar
              style={{ width: `${(uploadedSize / totalSize) * 100}%` }}
              className="rounded-full blur-xs transition-all duration-500 ease-out"
            />
          </div>
          {/* {`${Math.floor((uploadedSize / totalSize) * 100)}%`} */}
        </div>
      </div>
    </div>
  );
};

export default Page;
