
/**
 * Compresses an image file by resizing and reducing quality using canvas.
 * @param file The original image file
 * @param maxWidth Maximum width for the compressed image
 * @param maxHeight Maximum height for the compressed image
 * @param quality Quality of the compression (0.0 to 1.0)
 * @returns A promise that resolves to a Blob representing the compressed image
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200, 
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
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

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Convenience function to process an image and return both the blob and a preview URL.
 */
export async function optimizeImageForUpload(file: File): Promise<{ blob: Blob; previewUrl: string }> {
  // Balanced resolution for mobile/laptop: 1200px max dimension is usually plenty for web display
  const compressedBlob = await compressImage(file, 1200, 1200, 0.7);
  const previewUrl = URL.createObjectURL(compressedBlob);
  return { blob: compressedBlob, previewUrl };
}
