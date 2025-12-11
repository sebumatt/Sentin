import { GoogleGenAI, Modality } from "@google/genai";

let audioContext: AudioContext | null = null;

// Initialize AudioContext on user gesture
export const initializeAudio = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

export const generateVoiceAlert = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash-preview-tts for low latency text-to-speech
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.warn("TTS: No audio data returned from model.");
        return null;
    }

    // Initialize AudioContext if not already done (fallback)
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // Decode Base64 to Raw PCM Bytes
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // IMPORTANT: Gemini TTS returns raw PCM (Int16), NOT a wav file.
    // We must decode it manually as audioContext.decodeAudioData expects file headers.
    return pcmToAudioBuffer(bytes, audioContext);

  } catch (error) {
    console.error("TTS Generation failed:", error);
    return null;
  }
};

export const playAudioBuffer = async (buffer: AudioBuffer): Promise<AudioBufferSourceNode | undefined> => {
    if (!audioContext) return;
    
    // Ensure context is running (fixes autoplay policy issues)
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
             console.error("Failed to resume audio context:", e);
        }
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    return source;
};

// Helper: Convert Raw PCM (Int16) to AudioBuffer (Float32)
// Gemini output is typically 24kHz, 1 channel
function pcmToAudioBuffer(pcmData: Uint8Array, ctx: AudioContext, sampleRate: number = 24000): AudioBuffer {
  const numChannels = 1;
  const dataInt16 = new Int16Array(pcmData.buffer);
  const frameCount = dataInt16.length;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}
