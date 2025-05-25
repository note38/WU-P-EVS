"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File | null;
  originalFileName: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropDialog({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
  originalFileName,
}: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // Initialize crop area when image loads
  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current;
      setImageSize({ width: img.clientWidth, height: img.clientHeight });

      // Set initial crop area to center square
      const size = Math.min(img.clientWidth, img.clientHeight) * 0.8;
      const x = (img.clientWidth - size) / 2;
      const y = (img.clientHeight - size) / 2;

      setCropArea({ x, y, width: size, height: size });
    }
  };

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on resize handle (bottom-right corner)
      const handleSize = 15;
      const isOnHandle =
        x >= cropArea.x + cropArea.width - handleSize &&
        x <= cropArea.x + cropArea.width + handleSize &&
        y >= cropArea.y + cropArea.height - handleSize &&
        y <= cropArea.y + cropArea.height + handleSize;

      if (isOnHandle) {
        setIsResizing(true);
        setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      } else if (
        x >= cropArea.x &&
        x <= cropArea.x + cropArea.width &&
        y >= cropArea.y &&
        y <= cropArea.y + cropArea.height
      ) {
        setIsDragging(true);
        setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      }
    },
    [cropArea]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging) {
        const newX = Math.max(
          0,
          Math.min(x - dragStart.x, imageSize.width - cropArea.width)
        );
        const newY = Math.max(
          0,
          Math.min(y - dragStart.y, imageSize.height - cropArea.height)
        );
        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        const newWidth = Math.max(
          50,
          Math.min(x - cropArea.x, imageSize.width - cropArea.x)
        );
        const newHeight = newWidth; // Keep square aspect ratio
        setCropArea((prev) => ({
          ...prev,
          width: newWidth,
          height: Math.min(newHeight, imageSize.height - prev.y),
        }));
      }
    },
    [isDragging, isResizing, dragStart, cropArea, imageSize]
  );

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for better drag handling
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging) {
        const newX = Math.max(
          0,
          Math.min(x - dragStart.x, imageSize.width - cropArea.width)
        );
        const newY = Math.max(
          0,
          Math.min(y - dragStart.y, imageSize.height - cropArea.height)
        );
        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        const newWidth = Math.max(
          50,
          Math.min(x - cropArea.x, imageSize.width - cropArea.x)
        );
        const newHeight = newWidth; // Keep square aspect ratio
        setCropArea((prev) => ({
          ...prev,
          width: newWidth,
          height: Math.min(newHeight, imageSize.height - prev.y),
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragStart, cropArea, imageSize]);

  // Crop the image and return as File
  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current || !imageFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Calculate scale factor between displayed image and actual image
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Set canvas size to desired output size (square)
    const outputSize = 300; // 300x300 px output
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Draw cropped image to canvas
    ctx.drawImage(
      img,
      cropArea.x * scaleX, // source x
      cropArea.y * scaleY, // source y
      cropArea.width * scaleX, // source width
      cropArea.height * scaleY, // source height
      0, // destination x
      0, // destination y
      outputSize, // destination width
      outputSize // destination height
    );

    // Convert canvas to blob and then to File
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], originalFileName, {
            type: imageFile.type,
            lastModified: Date.now(),
          });
          onCropComplete(croppedFile);
        }
      },
      imageFile.type,
      0.9
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Drag the blue box to move the crop area or drag the bottom-right
            corner to resize. The image will be cropped to a square.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex justify-center">
          {imageSrc && (
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-full max-h-96 object-contain select-none"
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDragStart={(e) => e.preventDefault()}
              />

              {/* Crop overlay */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Resize handle */}
                <div
                  className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-sm"
                  style={{
                    right: -8,
                    bottom: -8,
                    cursor: isResizing ? "nw-resize" : "se-resize",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = imageRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setIsResizing(true);
                    setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
                  }}
                />
              </div>

              {/* Dark overlay for non-cropped areas */}
              <div
                className="absolute inset-0 bg-black/50 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${cropArea.x}px 100%, 
                    ${cropArea.x}px ${cropArea.y}px, 
                    ${cropArea.x + cropArea.width}px ${cropArea.y}px, 
                    ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px, 
                    ${cropArea.x}px ${cropArea.y + cropArea.height}px, 
                    ${cropArea.x}px 100%, 
                    100% 100%, 
                    100% 0%
                  )`,
                }}
              />
            </div>
          )}
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>Crop & Use Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
