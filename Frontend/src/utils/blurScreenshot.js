const SCREENSHOT_BLUR_FILTER = "blur(1.5px)";
const SCREENSHOT_JPEG_QUALITY = 0.55;

export const blurScreenshot = (dataUrl) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Could not prepare screenshot for upload."));
      return;
    }

    context.filter = SCREENSHOT_BLUR_FILTER;
    if (context.filter !== SCREENSHOT_BLUR_FILTER) {
      reject(new Error("Screenshot blurring is not supported by this desktop app."));
      return;
    }
    context.drawImage(image, 0, 0);

    try {
      resolve(canvas.toDataURL("image/jpeg", SCREENSHOT_JPEG_QUALITY));
    } catch (error) {
      reject(error);
    }
  };
  image.onerror = () => reject(new Error("Could not process captured screenshot."));
  image.src = dataUrl;
});
