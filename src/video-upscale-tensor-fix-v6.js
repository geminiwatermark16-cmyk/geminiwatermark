// Compatibility fix for UpscalerJS/ESRGAN tensor output.
// TensorFlow.js browser.toPixels accepts float tensors only in [0, 1], while
// some ESRGAN browser models return float32 RGB values in the image-like
// [0, 255] range. Detect that case and normalize without touching valid input.

let installed = false;

const installTensorToPixelsFix = () => {
  const tf = window.tf;
  const browser = tf?.browser;
  const current = browser?.toPixels;
  if (!browser || typeof current !== 'function') return false;
  if (current.__gwEsrganRangeFix) {
    installed = true;
    return true;
  }

  const nativeToPixels = current.bind(browser);

  const fixedToPixels = async (image, canvas) => {
    if (!image || image.dtype !== 'float32' || typeof image.max !== 'function') {
      return nativeToPixels(image, canvas);
    }

    let maxTensor = null;
    let minTensor = null;
    let normalized = null;

    try {
      maxTensor = image.max();
      minTensor = image.min();
      const [maxValue] = await maxTensor.data();
      const [minValue] = await minTensor.data();

      // Standard TF.js float image tensors are already [0,1].
      if (Number.isFinite(maxValue) && Number.isFinite(minValue) && maxValue <= 1 && minValue >= 0) {
        return nativeToPixels(image, canvas);
      }

      // ESRGAN commonly emits float RGB values around [0,255], occasionally
      // with tiny overshoots. Clamp those overshoots, then normalize to [0,1].
      normalized = image.clipByValue(0, 255).div(255);
      return await nativeToPixels(normalized, canvas);
    } finally {
      maxTensor?.dispose?.();
      minTensor?.dispose?.();
      normalized?.dispose?.();
    }
  };

  fixedToPixels.__gwEsrganRangeFix = true;
  fixedToPixels.__gwNativeToPixels = current;
  browser.toPixels = fixedToPixels;
  installed = true;
  return true;
};

if (!installTensorToPixelsFix()) {
  const started = Date.now();
  const timer = setInterval(() => {
    if (installTensorToPixelsFix() || Date.now() - started > 120000) {
      clearInterval(timer);
    }
  }, 10);
}

window.addEventListener('pageshow', () => {
  if (!installed) installTensorToPixelsFix();
});
