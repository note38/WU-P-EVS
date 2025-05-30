"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "@/hooks/use-toast";
import { cropImage } from "../../lib/image-utils";

// Import UI components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Lazy load the Cropper component as it's heavy
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleCropComplete = useCallback(
    (
      croppedArea: any,
      croppedAreaPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropSave = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) {
        return;
      }

      // Apply the crop using advanced crop function
      const croppedImage = await cropImage(
        imageSrc,
        {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        },
        512,
        512
      );

      onCropComplete(croppedImage);
      onOpenChange(false);

      toast({
        title: "Avatar cropped",
        description:
          "Your avatar has been cropped successfully. Don't forget to save your changes.",
      });
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Crop Error",
        description: "There was a problem cropping your image.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop your avatar</DialogTitle>
        </DialogHeader>
        <div className="relative h-64 w-full">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              cropShape="round"
              showGrid={false}
              rotation={0}
              minZoom={1}
              maxZoom={3}
              zoomSpeed={0.1}
              restrictPosition={true}
              objectFit="contain"
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#333",
                },
              }}
              classes={{}}
              mediaProps={{}}
              cropperProps={{}}
              keyboardStep={0.1}
            />
          )}
        </div>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-label="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCropSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
