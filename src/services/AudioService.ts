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
  private readonly TTS_API = 'https://tts.forcreatorspace.workers.dev';

  async generateAudio(options: AudioGenerationOptions): Promise<AudioMetadata> {
    try {
      const text = options.text.slice(0, this.MAX_TEXT_LENGTH);
      
      // Use Cloudflare Workers proxy for TTS
      const url = `${this.TTS_API}?text=${encodeURIComponent(text)}`;
      console.log('Debug: Fetching audio from:', url);
      
      // Fetch the audio with no-cors mode
      const response = await fetch(url, {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'audio/mpeg'
        }
      });

      console.log('Debug: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      // Get the audio data as blob
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }

      console.log('Debug: Audio blob size:', audioBlob.size);

      // Create URL for the audio blob
      const audioUrl = URL.createObjectURL(
        new Blob([audioBlob], { type: 'audio/mpeg' })
      );

      // Get audio duration
      const audioDuration = await this.getAudioDuration(audioUrl);
      console.log(`Debug: Generated audio duration: ${audioDuration}s`);

      return {
        url: audioUrl,
        duration: audioDuration || this.estimateDuration(text)
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  private estimateDuration(text: string): number {
    // Estimate duration based on word count (average speaking rate)
    const words = text.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    return (words / averageWordsPerMinute) * 60;
  }

  private async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      const timeoutId = setTimeout(() => {
        audio.remove();
        resolve(this.estimateDuration(audioUrl));
      }, 3000); // 3 second timeout

      audio.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        const duration = audio.duration;
        audio.remove();
        resolve(duration);
      };

      audio.onerror = () => {
        clearTimeout(timeoutId);
        audio.remove();
        console.warn('Failed to get audio duration, using estimate');
        resolve(this.estimateDuration(audioUrl));
      };

      audio.src = audioUrl;
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
      
      console.log(`Debug: Audio data size: ${audioData.length} bytes`);
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