/**
 * Enhanced utility functions for image processing
 */

/**
 * Image formats supported for conversion
 */
export type ImageFormat = "png" | "jpeg" | "webp";

/**
 * Options for image processing
 */
export interface ImageProcessingOptions {
  format?: ImageFormat;
  quality?: number; // 0-1 for jpeg and webp
  maxSize?: number; // Maximum file size in bytes
  maxWidth?: number;
  maxHeight?: number;
  minQuality?: number;
}

/**
 * Creates an image element from a data URL or source with better error handling
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    // Only set crossOrigin if it's not a data URL
    if (!url.startsWith("data:")) {
      image.setAttribute("crossOrigin", "anonymous");
    }

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => {
      reject(
        new Error(
          `Failed to load image: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    });

    // Set source after adding event listeners
    image.src = url;
  });
}

/**
 * Get optimized data URL from canvas based on options
 */
function getOptimizedDataURL(
  canvas: HTMLCanvasElement,
  options: ImageProcessingOptions = {}
): string {
  const { format = "webp", quality = 0.92 } = options;

  switch (format) {
    case "webp":
      return canvas.toDataURL("image/webp", quality);
    case "jpeg":
      // Fill with white background since JPEG doesn't support transparency
      const ctx = canvas.getContext("2d");
      if (ctx && format === "jpeg") {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Create a new canvas with white background
        const newCanvas = document.createElement("canvas");
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const newCtx = newCanvas.getContext("2d");

        if (newCtx) {
          newCtx.fillStyle = "#FFFFFF";
          newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
          newCtx.putImageData(imageData, 0, 0);
          return newCanvas.toDataURL("image/jpeg", quality);
        }
      }
      return canvas.toDataURL("image/jpeg", quality);
    case "png":
    default:
      return canvas.toDataURL("image/png");
  }
}

/**
 * Compress an image to a target file size (in KB) while maintaining quality
 */
export async function compressImage(
  imageSrc: string,
  targetSizeKB: number,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    format?: "jpeg" | "webp";
    minQuality?: number;
  } = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    format = "webp",
    minQuality = 0.5,
  } = options;

  // Create image element
  const image = await createImage(imageSrc);

  // Calculate new dimensions while maintaining aspect ratio
  let width = image.width;
  let height = image.height;
  const aspectRatio = width / height;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  // Ensure dimensions are integers
  width = Math.floor(width);
  height = Math.floor(height);

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  // Enable high-quality image processing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw image
  ctx.drawImage(image, 0, 0, width, height);

  // Binary search for optimal quality
  let minQ = minQuality;
  let maxQ = 1.0;
  let bestResult = "";
  let bestSize = Infinity;

  // Attempt at most 8 iterations to find optimal quality
  for (let i = 0; i < 8; i++) {
    const quality = (minQ + maxQ) / 2;
    const mimeType = format === "webp" ? "image/webp" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, quality);

    // Calculate size in KB
    const sizeKB = Math.ceil((dataUrl.length * 3) / 4 / 1024); // base64 size estimation

    if (Math.abs(bestSize - targetSizeKB) > Math.abs(sizeKB - targetSizeKB)) {
      bestResult = dataUrl;
      bestSize = sizeKB;
    }

    if (Math.abs(sizeKB - targetSizeKB) < 1) {
      // Close enough to target, exit early
      return dataUrl;
    }

    if (sizeKB > targetSizeKB) {
      maxQ = quality;
    } else {
      minQ = quality;
    }
  }

  return (
    bestResult ||
    canvas.toDataURL(
      format === "webp" ? "image/webp" : "image/jpeg",
      minQuality
    )
  );
}
