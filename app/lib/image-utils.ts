/**
 * Utility functions for image processing
 */

/**
 * Creates an image element from a data URL
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Crop and resize an image to a square with the specified size
 */
export async function cropImageToSquare(
  imageSrc: string,
  cropSize: number = 256
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

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

  // Draw cropped image centered and resized
  ctx.drawImage(image, xOffset, yOffset, size, size, 0, 0, cropSize, cropSize);

  // Convert to data URL (PNG)
  return canvas.toDataURL("image/png");
}

/**
 * Advanced crop based on user-selected area
 */
export async function cropImage(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  targetWidth: number = 256,
  targetHeight: number = 256
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas size to target dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Calculate pixel values from percentages
  const pixelCrop = {
    x: Math.round(image.width * (crop.x / 100)),
    y: Math.round(image.height * (crop.y / 100)),
    width: Math.round(image.width * (crop.width / 100)),
    height: Math.round(image.height * (crop.height / 100)),
  };

  // Draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Convert to data URL
  return canvas.toDataURL("image/png");
}

/**
 * Convert a data URL to a File object
 */
export function dataURLtoFile(
  dataUrl: string,
  filename: string = "avatar.png"
): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  minWidth: number = 256,
  minHeight: number = 256
): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        resolve(img.width >= minWidth && img.height >= minHeight);
      };
    };
  });
}

/**
 * Resize an image to fit within a maximum width/height while maintaining aspect ratio
 */
export async function resizeImage(
  imageSrc: string,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  let width = image.width;
  let height = image.height;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/png");
}
