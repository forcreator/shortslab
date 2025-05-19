interface CaptionOptions {
  text: string;
  duration: number;
  width: number;
  height: number;
  orientation?: 'portrait' | 'landscape';
}

interface CaptionFrame {
  text: string;
  startTime: number;
  endTime: number;
}

export class CaptionService {
  private readonly maxCharsPerLine = 40;
  private readonly fontSize = 48;
  private readonly lineHeight = 1.2;
  private readonly padding = 20;
  private readonly fadeDuration = 0.5; // seconds

  async generateCaptions(options: CaptionOptions): Promise<string[]> {
    const { text, duration, width, height, orientation = 'landscape' } = options;
    
    // Split text into words
    const words = text.split(' ');
    const frames: CaptionFrame[] = [];
    let currentFrame: string[] = [];
    let currentLine = '';
    
    // Calculate time per word (assuming average reading speed of 150 words per minute)
    const wordsPerSecond = 150 / 60;
    const timePerWord = 1 / wordsPerSecond;
    
    // Group words into frames
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (currentLine.length + word.length + 1 <= this.maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        currentFrame.push(currentLine);
        currentLine = word;
      }
      
      if (i === words.length - 1) {
        currentFrame.push(currentLine);
      }
      
      if (currentFrame.length === 2 || i === words.length - 1) {
        const startTime = Math.max(0, (i - currentFrame.join(' ').split(' ').length) * timePerWord);
        const endTime = Math.min(duration, (i + 1) * timePerWord);
        
        frames.push({
          text: currentFrame.join('\n'),
          startTime,
          endTime
        });
        
        currentFrame = [];
      }
    }
    
    // Generate caption frames
    const captionFrames: string[] = [];
    for (const frame of frames) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      // Calculate text position
      const lines = frame.text.split('\n');
      const totalHeight = lines.length * this.fontSize * this.lineHeight;
      const y = height - totalHeight - this.padding;
      
      // Draw text with white color and black outline for better visibility
      ctx.font = `${this.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      lines.forEach((line, index) => {
        const lineY = y + (index * this.fontSize * this.lineHeight);
        
        // Draw text outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(line, width / 2, lineY);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.fillText(line, width / 2, lineY);
      });
      
      captionFrames.push(canvas.toDataURL());
    }
    
    return captionFrames;
  }

  async getFrameData(dataUrl: string): Promise<Uint8Array> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  }
}

export const captionService = new CaptionService(); 