const NativeMediaRecorder = window.MediaRecorder;

const MP4_TYPES = [
  'video/mp4',
  'video/mp4;codecs=avc1.640033,mp4a.40.2',
  'video/mp4;codecs=avc1.640033',
  'video/mp4;codecs=avc1.4d0033,mp4a.40.2',
  'video/mp4;codecs=avc1.4d0033',
  'video/mp4;codecs=avc1.424033,mp4a.40.2',
  'video/mp4;codecs=avc1.424033',
];

function pickMp4Type() {
  if (!NativeMediaRecorder?.isTypeSupported) return '';
  return MP4_TYPES.find((type) => NativeMediaRecorder.isTypeSupported(type)) || '';
}

if (NativeMediaRecorder) {
  class Mp4OnlyMediaRecorder extends NativeMediaRecorder {
    constructor(stream, options = {}) {
      const mimeType = pickMp4Type();
      if (!mimeType) {
        throw new DOMException(
          'MP4/H.264 export is not supported by this browser. Please use the latest Chrome, Edge, or Safari.',
          'NotSupportedError'
        );
      }
      super(stream, { ...options, mimeType });
    }

    static isTypeSupported(type) {
      const value = String(type || '').toLowerCase();
      if (!value.startsWith('video/mp4')) return false;
      return Boolean(NativeMediaRecorder.isTypeSupported?.(type));
    }
  }

  window.MediaRecorder = Mp4OnlyMediaRecorder;
}

const waitForUpscaler = async (timeout = 8000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const button = document.getElementById('upscaleDownload');
    if (button) return button;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};

const downloadButton = await waitForUpscaler();
if (downloadButton) {
  downloadButton.textContent = 'Download MP4 ↓';

  downloadButton.addEventListener('click', async (event) => {
    const preview = document.getElementById('upscaleAfter');
    const message = document.getElementById('upscaleMessage');
    const src = preview?.src;
    if (!src) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const isMp4 = String(blob.type || '').toLowerCase().includes('mp4');
      if (!isMp4) {
        throw new Error('This browser did not create a true MP4 file. Please retry in the latest Chrome or Edge.');
      }

      const selectedName = document.getElementById('upscaleFileInput')?.files?.[0]?.name || 'video';
      const base = selectedName.replace(/\.[^.]+$/, '') || 'video';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}-2x-hq.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      if (message) {
        message.textContent = '2× High Quality MP4 is ready and downloading.';
        message.className = 'gwUpscaleMessage ok';
      }
    } catch (error) {
      if (message) {
        message.textContent = error?.message || 'MP4 download failed. Please retry in the latest Chrome or Edge.';
        message.className = 'gwUpscaleMessage error';
      }
    }
  }, { capture: true });
}
