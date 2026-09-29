/**
 * Client-side Web Audio Trimmer and WAV Encoder
 * Slices and optimizes PCM audio in browser without external dependencies.
 * Automatically downsamples and mixes to mono to stay well under Vercel's 4.5MB payload limit.
 */

export function formatTimeSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return Number(timeStr) || 0;
}

/**
 * Converts a Blob or File to a Base64 Data URL in browser memory
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert audio to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Encodes Float32Array PCM samples into standard 16-bit PCM WAV Blob
 */
export function encodePcmWavBlob(
  samples: Float32Array,
  sampleRate: number,
  numChannels: number = 1
): Blob {
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(8, "WAVE");

  // "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, length, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Backward compatibility wrapper
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  if (numChannels === 1) {
    return encodePcmWavBlob(audioBuffer.getChannelData(0), sampleRate, 1);
  }

  // Downmix to mono for size optimization
  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = audioBuffer.getChannelData(1);
  const mono = new Float32Array(audioBuffer.length);
  for (let i = 0; i < audioBuffer.length; i++) {
    mono[i] = (ch0[i] + ch1[i]) * 0.5;
  }
  return encodePcmWavBlob(mono, sampleRate, 1);
}

/**
 * Cross-browser decodeAudioData helper ensuring compatibility and non-detached buffers
 */
function decodeAudioSafely(ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Clone arrayBuffer because decodeAudioData detaches memory in modern specs
    const copy = arrayBuffer.slice(0);

    const promise = ctx.decodeAudioData(
      copy,
      (decoded) => resolve(decoded),
      (err) => reject(err || new Error("Failed to decode audio file"))
    );

    if (promise && typeof promise.then === "function") {
      promise.then(resolve).catch(reject);
    }
  });
}

/**
 * Slices any audio source (local File or URL) between startSeconds and endSeconds,
 * downsampling and downmixing to mono to guarantee the output WAV file stays well under 3MB.
 */
export async function sliceAudioSource(
  sourceUrlOrFile: string | File,
  startSeconds: number,
  endSeconds: number
): Promise<{ blob: Blob; duration: number; sizeBytes: number }> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio is not supported in this browser");
  }
  const ctx = new AudioContextClass();

  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof sourceUrlOrFile === "string") {
      let fetchUrl = sourceUrlOrFile;
      if (sourceUrlOrFile.startsWith("http://") || sourceUrlOrFile.startsWith("https://")) {
        try {
          const origin = window.location.origin;
          if (!sourceUrlOrFile.startsWith(origin)) {
            fetchUrl = `/api/audio-proxy?url=${encodeURIComponent(sourceUrlOrFile)}`;
          }
        } catch {}
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Failed to download audio track (Status: ${res.status})`);
      }
      arrayBuffer = await res.arrayBuffer();
    } else {
      arrayBuffer = await sourceUrlOrFile.arrayBuffer();
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Audio buffer is empty");
    }

    const decodedBuffer = await decodeAudioSafely(ctx, arrayBuffer);
    const sourceSampleRate = decodedBuffer.sampleRate;
    const numChannels = decodedBuffer.numberOfChannels;

    const clampedStart = Math.max(0, Math.min(startSeconds, decodedBuffer.duration));
    // Max 75 seconds clip to guarantee light payload for ambient wedding loops
    const maxEnd = Math.min(decodedBuffer.duration, clampedStart + 75);
    const clampedEnd = Math.max(clampedStart + 0.5, Math.min(endSeconds, maxEnd));
    const sliceDuration = clampedEnd - clampedStart;

    // Determine target sample rate: 22,050 Hz is crystal clear for web audio and very lightweight
    let targetSampleRate = 22050;
    if (sliceDuration <= 45) {
      targetSampleRate = 24000; // ~48KB/s -> ~2.1MB for 45s
    } else if (sliceDuration > 60) {
      targetSampleRate = 16000; // ~32KB/s -> ~2.4MB for 75s
    }

    const targetLength = Math.max(1, Math.floor(sliceDuration * targetSampleRate));
    const monoData = new Float32Array(targetLength);

    const ch0 = decodedBuffer.getChannelData(0);
    const ch1 = numChannels > 1 ? decodedBuffer.getChannelData(1) : null;

    const sourceStartIndex = clampedStart * sourceSampleRate;
    const step = (sliceDuration * sourceSampleRate) / targetLength;

    // Resample with linear interpolation and mixdown to mono
    for (let i = 0; i < targetLength; i++) {
      const srcPos = sourceStartIndex + i * step;
      const idx0 = Math.floor(srcPos);
      const idx1 = Math.min(idx0 + 1, decodedBuffer.length - 1);
      const frac = srcPos - idx0;

      const s0 = (ch0[idx0] || 0) * (1 - frac) + (ch0[idx1] || 0) * frac;
      if (ch1) {
        const s1 = (ch1[idx0] || 0) * (1 - frac) + (ch1[idx1] || 0) * frac;
        monoData[i] = (s0 + s1) * 0.5;
      } else {
        monoData[i] = s0;
      }
    }

    const wavBlob = encodePcmWavBlob(monoData, targetSampleRate, 1);

    return {
      blob: wavBlob,
      duration: sliceDuration,
      sizeBytes: wavBlob.size,
    };
  } finally {
    if (ctx.state !== "closed") {
      await ctx.close().catch(() => {});
    }
  }
}
