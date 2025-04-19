interface AudioGenerationOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

interface AudioMetadata {
  url: string;
  duration: number;
}

export class AudioService {
  private readonly MAX_TEXT_LENGTH = 200;

  async generateAudio(options: AudioGenerationOptions): Promise<AudioMetadata> {
    try {
      const text = options.text.slice(0, this.MAX_TEXT_LENGTH); // Google TTS has a length limit
      const rate = options.rate || 1.0;
      
      // Use our proxy endpoint instead of direct Google TTS access
      const url = `/api/tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodeURIComponent(text)}`;

      // Fetch the audio
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
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
      throw error;
    }
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