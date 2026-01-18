"use client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Copy, Phone, RotateCcw, Send } from "lucide-react";
import { wsRtcConnectionHook } from "@/hooks/ws-rtc-connection";
import { useParams } from "next/navigation";
import RainBowBar from "@/components/mine/rainbow-bar";
import { LightDarkMode } from "@/components/mine/light-dark-mode";
import { toast } from "sonner";
import TextMatrixRain from "@/components/mine/text-matrix";

const Page = () => {
  const params = useParams();
  const { id } = params as { id: string };
  const {
    send,
    setFile,
    Image,
    uploadedSize,
    setUploadedSize,
    totalSize,
    setTotalSize,
    File,
    updatedUploadedSize,
    totalUserCount,
    remoteVideoStream,
    localVideoStream,
    localStreams,
    sendingFile,
    fileNameRef,
  } = wsRtcConnectionHook({ roomId: id });

  console.log(id);
  return (
    <div className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_448px_1rem_1fr] grid-rows-[auto_1px_auto_1px_auto_1px_auto_1px_auto_1px_auto] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10 overflow-hidden">
      <div className=" gap-2 flex flex-col items-center absolute right-4 top-4">
        <div className="flex gap-2">
          <LightDarkMode />
          <Button
            size="icon"
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-dashed rounded-none"
          >
            <RotateCcw />
          </Button>{" "}
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Copied to clipboard");
            }}
            className="border-dashed rounded-none"
          >
            <Copy />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={async () => {
              if (localStreams.current) {
                localStreams.current.getTracks().forEach((t) => {
                  t.enabled = !t.enabled;
                });
              }
            }}
            className="border-dashed rounded-none"
          >
            <Phone />
          </Button>
        </div>
      </div>

      <Button
        size="icon"
        variant="outline"
        className="text-green-400 rounded-none border-dashed absolute left-4 top-4"
      >
        <TextMatrixRain repeat={false}>{String(totalUserCount)}</TextMatrixRain>
      </Button>

      <div className="col-start-3 row-start-1 max-w-md w-full flex flex-col justify-center items-center gap-4 p-4">
        <div className="flex justify-between w-full gap-2 border p-4 border-dashed">
          {Image ? (
            <img
              src={Image}
              className="w-20 aspect-square object-cover border border-dashed"
              alt="received"
            />
          ) : (
            <div className=" w-20 aspect-square flex justify-center items-center text-xs border border-dashed">
              No Image
            </div>
          )}
          {Image ? (
            <video
              autoPlay
              muted
              loop
              src={Image}
              className="w-20 aspect-square object-cover border border-dashed"
            />
          ) : (
            <div className=" w-20 aspect-square flex justify-center items-center text-xs border border-dashed">
              No Image
            </div>
          )}
          <video
            className="border border-dashed scale-x-[-1] w-20 aspect-square object-cover"
            ref={localVideoStream}
            autoPlay
            playsInline
            muted
          ></video>
          <video
            className="border border-dashed scale-x-[-1] w-20 aspect-square object-cover"
            ref={remoteVideoStream}
            autoPlay
            playsInline
          ></video>
        </div>
        <div className="flex justify-end w-full">
          <a
            href={Image || ""}
            download={`${fileNameRef.current || "downloaded_file"}`}
          >
            <Button
              variant="outline"
              className="rounded-none border-dashed"
              size="sm"
            >
              Download
            </Button>
          </a>
        </div>
      </div>
      <div className="pointer-events-none  mask-x-from-90% relative col-span-full col-start-1 row-start-4  border-b z-50" />
      <div className="col-start-3 row-start-5 max-w-md w-full flex flex-col gap-2">
        <FileUpload onChange={setFile} />
      </div>
      <div className="pointer-events-none relative col-span-full col-start-1 row-start-6 mask-x-from-90% border-b z-50" />
      <div className="col-start-3 row-start-7 max-w-md w-full flex justify-center p-4 flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <RainBowBar
            style={{ width: `${(uploadedSize / totalSize) * 100}%` }}
            className="transition-all duration-500 ease-out absolute inset-0 w-full bg-accent/30"
          />
          <div className="flex items-center justify-between gap-2 w-full">
            <Button
              disabled={sendingFile}
              className="border-dashed rounded-none z-30"
              variant="outline"
              onClick={(e) => {
                if (!File?.length) return toast.error("Please enter a file");
                e.preventDefault();
                setUploadedSize(10);
                setTotalSize(0);
                updatedUploadedSize.current = 0;
                send();
              }}
              type="submit"
              size="icon"
            >
              <Send />
            </Button>
            <span className="font-mono text-lg text-muted-foreground z-30">
              {totalSize > 0
                ? `${Math.floor((uploadedSize / totalSize) * 100)}%`
                : "0%"}
            </span>
          </div>
        </div>
      </div>
      {/* Separator */}
      <div className="pointer-events-none relative col-span-full col-start-1 row-start-8 mask-x-from-90% border-b z-50 " />
      {/* Decorative borders - row span full */}
      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50"></div>
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50"></div>
    </div>
  );
};

export default Page;
