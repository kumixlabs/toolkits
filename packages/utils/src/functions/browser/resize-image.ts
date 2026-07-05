/**
 * Utility function for client-side image resizing
 * Provides browser-based image resizing with aspect ratio handling
 */

/**
 * Resizes an image file to specified dimensions while maintaining aspect ratio
 * Uses canvas to perform the resize operation in the browser
 *
 * @param file - The image File object to resize
 * @param opts - Resize options
 * @param opts.width - Target width in pixels (default: 1200)
 * @param opts.height - Target height in pixels (default: 630)
 * @param opts.quality - JPEG quality from 0.0 to 1.0 (default: 1.0)
 * @returns A Promise that resolves to a base64-encoded data URL of the resized image
 *
 * @example
 * ```ts
 * import { resizeImage } from '@/utils/functions';
 *
 * // Basic usage with a file from input
 * const fileInput = document.querySelector('input[type="file"]');
 * fileInput.addEventListener('change', async (e) => {
 *   const file = e.target.files[0];
 *   if (file) {
 *     try {
 *       // Resize to default dimensions (1200x630)
 *       const resizedImage = await resizeImage(file);
 *
 *       // Display the resized image
 *       const img = document.createElement('img');
 *       img.src = resizedImage;
 *       document.body.appendChild(img);
 *     } catch (error) {
 *       console.error('Image resize failed:', error);
 *     }
 *   }
 * });
 *
 * // With custom dimensions and quality
 * const thumbnail = await resizeImage(file, {
 *   width: 300,
 *   height: 200,
 *   quality: 0.8
 * });
 *
 * // Use the resized image in an upload
 * const formData = new FormData();
 * formData.append('image', thumbnail);
 * await fetch('/api/upload', { method: 'POST', body: formData });
 * ```
 */
export const resizeImage = (
  file: File,
  opts: {
    width: number;
    height: number;
    quality?: number;
  } = {
    width: 1200,
    height: 630,
    quality: 1.0,
  },
): Promise<string> => {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("resizeImage only works in browser environments"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const targetWidth = opts.width;
        const targetHeight = opts.height;
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.imageSmoothingQuality = "high"; // Set image smoothing quality to high

        // Calculating the aspect ratio
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const sourceAspectRatio = sourceWidth / sourceHeight;
        const targetAspectRatio = targetWidth / targetHeight;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        // Adjust drawing sizes based on the aspect ratio
        if (sourceAspectRatio > targetAspectRatio) {
          // Source is wider
          drawHeight = sourceHeight;
          drawWidth = sourceHeight * targetAspectRatio;
          offsetX = (sourceWidth - drawWidth) / 2;
        } else {
          // Source is taller or has the same aspect ratio
          drawWidth = sourceWidth;
          drawHeight = sourceWidth / targetAspectRatio;
          offsetY = (sourceHeight - drawHeight) / 2;
        }

        // Draw the image onto the canvas
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        );

        // Convert the canvas to a base64 string
        const base64Image = canvas.toDataURL("image/jpeg", opts.quality);
        resolve(base64Image);
      };
      img.onerror = (error) => reject(new Error(`Image loading error: ${error}`));
    };
    reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
    reader.readAsDataURL(file);
  });
};

/**
 * Resize and crop an image to a centered rectangle of the specified size.
 *
 * Processing steps:
 * - Load the image from the given `File`
 * - Determine target width & height from `size`
 *   - `number` → width = height = value (e.g. `512`)
 *   - `[width, height]` → explicit width & height (e.g. `[512, 1080]`)
 *   - `null | undefined` → use the original image width & height
 * - Compute a centered crop region that matches the target aspect ratio
 * - Draw the cropped region to the canvas and export with desired format
 *
 * @param file The source image file to process
 * @param name The base name (without extension) for the output file
 * @param size Target size:
 *  - `number` → square (width & height)
 *  - `[width, height]` → custom rectangle
 *  - `null | undefined` → use original image size
 * @param extension Output image extension (e.g., "png", "jpeg", "webp")
 * @returns A new `File` containing the processed image in the requested format
 *
 * @example
 * ```ts
 * // 1) Square: size = 512 → 512x512
 * const out1 = await resizeAndCropImage(file, "avatar", 512, "webp");
 *
 * // 2) Custom rectangle: size = [512, 1080] → 512x1080
 * const out2 = await resizeAndCropImage(file, "poster", [512, 1080], "jpeg");
 *
 * // 3) Keep original dimensions: size = null → originalWidth x originalHeight
 * const out3 = await resizeAndCropImage(file, "original", null, "png");
 * ```
 */
export async function resizeAndCropImage(
  file: File,
  name: string,
  size: number | [number, number] | null | undefined,
  extension: string,
): Promise<File> {
  const image = await loadImage(file);

  // Determine target width & height based on `size` parameter
  let targetWidth: number;
  let targetHeight: number;

  if (Array.isArray(size)) {
    [targetWidth, targetHeight] = size;
  } else if (typeof size === "number") {
    targetWidth = size;
    targetHeight = size;
  } else {
    // When `size` is null or undefined, use original image dimensions
    targetWidth = image.width;
    targetHeight = image.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");

  // If we are using the original size, just draw the full image without cropping
  if (targetWidth === image.width && targetHeight === image.height) {
    ctx?.drawImage(image, 0, 0);
  } else {
    // Compute centered crop region based on aspect ratio (cover behavior)
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    let sx = 0;
    let sy = 0;
    let sWidth = sourceWidth;
    let sHeight = sourceHeight;

    if (targetAspect > sourceAspect) {
      // Target is wider → limit by width, crop top & bottom
      sWidth = sourceWidth;
      sHeight = sourceWidth / targetAspect;
      sy = (sourceHeight - sHeight) / 2;
    } else if (targetAspect < sourceAspect) {
      // Target is taller → limit by height, crop left & right
      sHeight = sourceHeight;
      sWidth = sourceHeight * targetAspect;
      sx = (sourceWidth - sWidth) / 2;
    }

    ctx?.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
  }

  const resizedImageBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, `image/${extension}`),
  );

  return new File([resizedImageBlob as BlobPart], `${name}.${extension}`, {
    type: `image/${extension}`,
  });
}

/**
 * Load a `File` into an `HTMLImageElement` using `FileReader`
 *
 * Behavior:
 * - Reads the file as a Data URL and assigns it to `Image.src`
 * - Resolves once the image has fully loaded
 * - Rejects if the image fails to load
 *
 * @param file The image file to read and load
 * @returns A promise that resolves to an `HTMLImageElement` ready for drawing
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target?.result as string;
    };

    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
}

/**
 * Convert a `File` to a Base64-encoded Data URL string
 *
 * @param file The file to convert
 * @returns A promise that resolves to a Base64 Data URL string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
