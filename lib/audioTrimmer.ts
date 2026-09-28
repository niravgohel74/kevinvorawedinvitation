/**
 * Client-side Web Audio Trimmer and WAV Encoder
 * Slices PCM audio in browser without external dependencies.
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
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = audioBuffer.length * numChannels * bytesPerSample;
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

  // Write PCM audio samples (interleaved)
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Cross-browser decodeAudioData helper ensuring compatibility and non-detached buffers
 */
function decodeAudioSafely(ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Clone arrayBuffer because decodeAudioData detaches memory in modern specs
    const copy = arrayBuffer.slice(0);

    // Some browsers return a promise, while older ones require callbacks
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
 * Slices any audio source (local File or URL) between startSeconds and endSeconds
 */
export async function sliceAudioSource(
  sourceUrlOrFile: string | File,
  startSeconds: number,
  endSeconds: number
): Promise<{ blob: Blob; duration: number }> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio is not supported in this browser");
  }
  const ctx = new AudioContextClass();

  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof sourceUrlOrFile === "string") {
      let fetchUrl = sourceUrlOrFile;
      // If external URL, pass through server proxy to bypass CORS
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
    const sampleRate = decodedBuffer.sampleRate;
    const channels = decodedBuffer.numberOfChannels;

    const clampedStart = Math.max(0, Math.min(startSeconds, decodedBuffer.duration));
    const clampedEnd = Math.max(clampedStart + 0.5, Math.min(endSeconds, decodedBuffer.duration));

    const startSample = Math.floor(clampedStart * sampleRate);
    const endSample = Math.floor(clampedEnd * sampleRate);
    const sliceLength = Math.max(1, endSample - startSample);

    const trimmedBuffer = ctx.createBuffer(channels, sliceLength, sampleRate);

    for (let ch = 0; ch < channels; ch++) {
      const sourceChannel = decodedBuffer.getChannelData(ch);
      const targetChannel = trimmedBuffer.getChannelData(ch);
      for (let i = 0; i < sliceLength; i++) {
        targetChannel[i] = sourceChannel[startSample + i];
      }
    }

    const wavBlob = audioBufferToWavBlob(trimmedBuffer);
    return {
      blob: wavBlob,
      duration: trimmedBuffer.duration,
    };
  } finally {
    if (ctx.state !== "closed") {
      await ctx.close().catch(() => {});
    }
  }
}
