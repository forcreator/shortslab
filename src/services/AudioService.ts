interface AudioGenerationOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface AudioMetadata {
  url: string;
  duration: number;
}

export class AudioService {
  private readonly MAX_TEXT_LENGTH = 200;

  async generateAudio(options: AudioGenerationOptions): Promise<AudioMetadata> {
    try {
      const text = options.text.slice(0, this.MAX_TEXT_LENGTH);
      const rate = options.rate || 1.0;
      
      // Use a production-ready TTS service
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodeURIComponent(text)}`;

      // Create audio context for browser-based synthesis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fetch the audio with proper headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://translate.google.com/',
          'Accept': 'audio/mpeg'
        }
      });

      if (!response.ok) {
        // Fallback to browser's speech synthesis if fetch fails
        return this.generateBrowserAudio(text, rate);
      }

      // Get the audio data as blob
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }

      // Create URL for the audio blob
      const audioUrl = URL.createObjectURL(
        new Blob([audioBlob], { type: 'audio/mpeg' })
      );

      // Get audio duration
      const audioDuration = await this.getAudioDuration(audioUrl);
      console.log(`Generated audio duration: ${audioDuration}s, size: ${audioBlob.size} bytes`);

      return {
        url: audioUrl,
        duration: audioDuration
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      // Fallback to browser's speech synthesis
      return this.generateBrowserAudio(options.text, options.rate || 1.0);
    }
  }

  private async generateBrowserAudio(text: string, rate: number): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.lang = 'en-US';

      // Create a blob from the synthesized speech
      const audioChunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(new MediaStream());

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve({
          url: audioUrl,
          duration: (text.length / 15) * (1 / rate) // Approximate duration based on text length
        });
      };

      utterance.onend = () => {
        mediaRecorder.stop();
      };

      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);
    });
  }

  private async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        reject(new Error('Failed to load audio for duration check'));
      };
      audio.load();
    });
  }

  async getAudioData(audioUrl: string): Promise<Uint8Array> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      
      console.log(`Audio data size: ${audioData.length} bytes`);
      if (audioData.length === 0) {
        throw new Error('Audio data is empty');
      }

      return audioData;
    } catch (error) {
      console.error('Error processing audio data:', error);
      throw error;
    }
  }

  cleanup(audioUrl: string) {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }
}

export const audioService = new AudioService(); 