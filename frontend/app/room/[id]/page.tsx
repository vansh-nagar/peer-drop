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
import { useRef } from "react";

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
    pc,
    remoteVideoStream,
    localVideoStream,
    localStreams,
  } = wsRtcConnectionHook({ roomId: id });

  console.log(id);
  return (
    <div className=" w-full flex justify-center items-start p-3">
      <div className=" fixed top-4 right-4 flex gap-2 flex-col z-50">
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
        <Button
          size={"icon"}
          variant={"outline"}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Copied to clipboard");
          }}
          className=" border-dashed rounded-none"
        >
          <Copy />
        </Button>
        <Button
          size={"icon"}
          variant={"outline"}
          onClick={async () => {
            // const track = localStreams.current?.getTracks();
            // const anyEnabled = track?.some((t) => t.enabled);

            if (localStreams.current) {
              localStreams.current.getTracks().forEach((t) => {
                t.enabled = !t.enabled;
              });
            }

            // if (anyEnabled) {
            //   track?.forEach((track) => track.stop());
            //   localStreams.current = null;
            //   console.log("stoppedddddddddddddddddd");
            // } else {
            //   const stream = await navigator.mediaDevices.getUserMedia({
            //     video: true,
            //     audio: true,
            //   });

            //   localStreams.current = stream;

            //   if (localVideoStream.current) {
            //     localVideoStream.current.srcObject = stream;
            //   }

            //   stream.getTracks().forEach((track) => {
            //     pc.current?.addTrack(track, stream);
            //   });
            //   console.log("Stream Startedddddddddddddddddd");
            // }
          }}
          className=" border-dashed rounded-none"
        >
          {<Phone />}
        </Button>
      </div>
      <div>
        <Button
          size={"icon"}
          variant={"outline"}
          className="fixed top-4 left-4 text-green-400 rounded-none border-dashed"
        >
          <TextMatrixRain repeat={false}>
            {String(totalUserCount)}
          </TextMatrixRain>
        </Button>
      </div>
      <div className="max-w-md w-full flex flex-col justify-center  gap-2">
        <div
          className=" flex justify-center w-full h-20
         aspect-square border border-dashed overflow-hidden"
        >
          {Image && (
            <img
              src={Image}
              className="w-20 aspect-square object-cover border "
              alt="recived"
            />
          )}
          {Image && (
            <video
              autoPlay
              muted
              loop
              src={Image}
              className=" w-20 aspect-square object-cover border"
            />
          )}
          <video
            className="border scale-x-[-1] w-20 aspect-square object-cover"
            ref={localVideoStream}
            autoPlay
            playsInline
            muted
          ></video>
          <video
            className="border scale-x-[-1] w-20 aspect-square object-cover "
            ref={remoteVideoStream}
            autoPlay
            playsInline
          ></video>
        </div>{" "}
        <div className="flex justify-end">
          <a href={Image || ""} download={true}>
            <Button
              variant={"outline"}
              className=" rounded-none border-dashed "
              size={"sm"}
            >
              Download
            </Button>
          </a>
        </div>
        <FileUpload onChange={setFile} />
        <div className="flex items-center gap-3">
          <div className="h-2 w-full overflow-hidden bg-muted rounded-full">
            <RainBowBar
              style={{ width: `${(uploadedSize / totalSize) * 100}%` }}
              className="rounded-full blur-xs transition-all duration-500 ease-out"
            />
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Page;
