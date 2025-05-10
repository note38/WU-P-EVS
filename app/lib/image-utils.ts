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
}

/**
 * Creates an image element from a data URL or source with better error handling
 */
export function createImage(url: string): Promise<HTMLImageElement> {
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
 * Crop and resize an image to a square with the specified size
 */
export async function cropImageToSquare(
  imageSrc: string,
  cropSize: number = 256,
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Determine the size for the square crop (min of width/height)
    const size = Math.min(image.width, image.height);

    // Calculate crop position (center)
    const xOffset = (image.width - size) / 2;
    const yOffset = (image.height - size) / 2;

    // Set canvas dimensions to desired size
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Optional: Apply a smooth resizing algorithm for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw cropped image centered and resized
    ctx.drawImage(
      image,
      xOffset,
      yOffset,
      size,
      size,
      0,
      0,
      cropSize,
      cropSize
    );

    // Convert to data URL with specified format and quality
    return getOptimizedDataURL(canvas, options);
  } catch (error) {
    throw new Error(
      `Error cropping image to square: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Advanced crop based on user-selected area with better pixel calculation
 */
export async function cropImage(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  targetWidth: number = 512,
  targetHeight: number = 512,
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas size to target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Enable high-quality image processing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Calculate pixel values from percentages or use direct values if they are pixels already
    const pixelCrop = {
      x: crop.x < 1 ? Math.round(image.width * crop.x) : Math.round(crop.x),
      y: crop.y < 1 ? Math.round(image.height * crop.y) : Math.round(crop.y),
      width:
        crop.width < 1
          ? Math.round(image.width * crop.width)
          : Math.round(crop.width),
      height:
        crop.height < 1
          ? Math.round(image.height * crop.height)
          : Math.round(crop.height),
    };

    // Ensure crop dimensions don't exceed the image boundaries
    const validX = Math.min(Math.max(0, pixelCrop.x), image.width - 1);
    const validY = Math.min(Math.max(0, pixelCrop.y), image.height - 1);
    const validWidth = Math.min(pixelCrop.width, image.width - validX);
    const validHeight = Math.min(pixelCrop.height, image.height - validY);

    // Draw cropped image
    ctx.drawImage(
      image,
      validX,
      validY,
      validWidth,
      validHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Convert to data URL with specified format
    return getOptimizedDataURL(canvas, options);
  } catch (error) {
    throw new Error(
      `Error cropping image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Convert a data URL to a File object with validation
 */
export function dataURLtoFile(
  dataUrl: string,
  filename: string = "image.png"
): File {
  try {
    if (!dataUrl.startsWith("data:")) {
      throw new Error("Input is not a valid data URL");
    }

    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);

    for (let i = 0; i < bstr.length; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    // Make sure the filename has the correct extension
    const extension = mime.split("/")[1];
    if (!filename.toLowerCase().endsWith(`.${extension}`)) {
      filename = `${filename.split(".")[0]}.${extension}`;
    }

    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    throw new Error(
      `Error converting data URL to file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate image dimensions and format
 */
export async function validateImage(
  file: File,
  options: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    maxSizeKB?: number;
    allowedFormats?: string[];
  } = {}
): Promise<{
  valid: boolean;
  reason?: string;
  dimensions?: { width: number; height: number };
}> {
  return new Promise((resolve) => {
    // Check file size if specified
    if (options.maxSizeKB && file.size > options.maxSizeKB * 1024) {
      resolve({
        valid: false,
        reason: `Image exceeds maximum size of ${options.maxSizeKB}KB`,
      });
      return;
    }

    // Check file format if specified
    if (options.allowedFormats && options.allowedFormats.length > 0) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();

      const isFormatValid = options.allowedFormats.some(
        (format) =>
          mimeType.includes(format) ||
          (fileExtension && format.includes(fileExtension))
      );

      if (!isFormatValid) {
        resolve({
          valid: false,
          reason: `Image format not supported. Allowed formats: ${options.allowedFormats.join(", ")}`,
        });
        return;
      }
    }

    // Check dimensions
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        if (options.minWidth && width < options.minWidth) {
          resolve({
            valid: false,
            reason: `Image width must be at least ${options.minWidth}px`,
            dimensions: { width, height },
          });
          return;
        }

        if (options.minHeight && height < options.minHeight) {
          resolve({
            valid: false,
            reason: `Image height must be at least ${options.minHeight}px`,
            dimensions: { width, height },
          });
          return;
        }

        if (options.maxWidth && width > options.maxWidth) {
          resolve({
            valid: false,
            reason: `Image width must not exceed ${options.maxWidth}px`,
            dimensions: { width, height },
          });
          return;
        }

        if (options.maxHeight && height > options.maxHeight) {
          resolve({
            valid: false,
            reason: `Image height must not exceed ${options.maxHeight}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
        });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          reason: "Failed to load image for validation",
        });
      };
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        reason: "Failed to read image file",
      });
    };
  });
}

/**
 * Resize an image to fit within a maximum width/height while maintaining aspect ratio
 */
export async function resizeImage(
  imageSrc: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Calculate new dimensions while maintaining aspect ratio
    let width = image.width;
    let height = image.height;

    // Handle aspect ratio
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

    canvas.width = width;
    canvas.height = height;

    // Enable high-quality resizing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(image, 0, 0, width, height);

    return getOptimizedDataURL(canvas, options);
  } catch (error) {
    throw new Error(
      `Error resizing image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a circular avatar image with optional border
 */
export async function createCircularAvatar(
  imageSrc: string,
  size: number = 256,
  options: ImageProcessingOptions & {
    borderWidth?: number;
    borderColor?: string;
  } = {}
): Promise<string> {
  try {
    // First crop to square
    const squareImage = await cropImageToSquare(imageSrc, size);
    const image = await createImage(squareImage);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set dimensions
    canvas.width = size;
    canvas.height = size;

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Draw the image
    ctx.drawImage(image, 0, 0, size, size);

    // Add border if specified
    if (options.borderWidth && options.borderWidth > 0) {
      ctx.strokeStyle = options.borderColor || "#ffffff";
      ctx.lineWidth = options.borderWidth;
      ctx.stroke();
    }

    return getOptimizedDataURL(canvas, options);
  } catch (error) {
    throw new Error(
      `Error creating circular avatar: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get optimized data URL from canvas based on options
 */
function getOptimizedDataURL(
  canvas: HTMLCanvasElement,
  options: ImageProcessingOptions = {}
): string {
  const { format = "png", quality = 0.92 } = options;

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
 * Uses an iterative approach to find the optimal quality setting
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
  try {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      format = "jpeg",
      minQuality = 0.5,
    } = options;

    // First resize to reduce dimensions if needed
    const resized = await resizeImage(imageSrc, maxWidth, maxHeight, {
      format,
    });
    const image = await createImage(resized);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Binary search for optimal quality
    let minQ = minQuality;
    let maxQ = 1.0;
    let bestResult = resized;
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

    return bestResult;
  } catch (error) {
    throw new Error(
      `Error compressing image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Apply a simple filter to an image
 */
export async function applyImageFilter(
  imageSrc: string,
  filter: "grayscale" | "sepia" | "invert" | "blur" | "brightness",
  intensity: number = 1.0, // 0-1 for most filters
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Apply the selected filter
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filter) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const gray =
            avg * intensity +
            (1 - intensity) *
              (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        break;

      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const newR = Math.min(
            255,
            r * (1 - 0.607 * intensity) +
              g * 0.769 * intensity +
              b * 0.189 * intensity
          );
          const newG = Math.min(
            255,
            r * 0.349 * intensity +
              g * (1 - 0.314 * intensity) +
              b * 0.168 * intensity
          );
          const newB = Math.min(
            255,
            r * 0.272 * intensity +
              g * 0.534 * intensity +
              b * (1 - 0.869 * intensity)
          );

          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        }
        break;

      case "invert":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i] * intensity - data[i] * (1 - intensity);
          data[i + 1] =
            255 - data[i + 1] * intensity - data[i + 1] * (1 - intensity);
          data[i + 2] =
            255 - data[i + 2] * intensity - data[i + 2] * (1 - intensity);
        }
        break;

      case "brightness":
        const factor = 1 + intensity;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * factor);
          data[i + 1] = Math.min(255, data[i + 1] * factor);
          data[i + 2] = Math.min(255, data[i + 2] * factor);
        }
        break;

      case "blur":
        // For blur, we'll just use CSS filter via canvas
        ctx.filter = `blur(${Math.max(1, intensity * 10)}px)`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        return getOptimizedDataURL(canvas, options);

      default:
        break;
    }

    // Apply the image data back to the canvas
    ctx.putImageData(imageData, 0, 0);

    return getOptimizedDataURL(canvas, options);
  } catch (error) {
    throw new Error(
      `Error applying filter: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
