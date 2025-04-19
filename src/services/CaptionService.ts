interface CaptionOptions {
  text: string;
  duration: number;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export class CaptionService {
  private readonly fontFamily = 'Arial';
  private readonly fontSize = 48;
  private readonly portraitFontSize = 72;
  private readonly fontColor = '#FFFFFF';
  private readonly strokeColor = '#000000';
  private readonly strokeWidth = 3;
  private readonly bgColor = 'rgba(0, 0, 0, 0.5)';
  private readonly padding = 20;

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  private drawTextWithBackground(
    ctx: CanvasRenderingContext2D,
    text: string[],
    x: number,
    y: number,
    maxWidth: number,
    isPortrait: boolean
  ) {
    const fontSize = isPortrait ? this.portraitFontSize : this.fontSize;
    const lineHeight = fontSize * 1.2;
    const totalHeight = text.length * lineHeight;
    
    // Draw background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(
      x - maxWidth/2 - this.padding,
      y - this.padding,
      maxWidth + (this.padding * 2),
      totalHeight + (this.padding * 2)
    );

    // Draw text
    text.forEach((line, i) => {
      const lineY = y + (i * lineHeight);
      
      // Draw stroke
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeText(line, x, lineY);

      // Draw fill
      ctx.fillStyle = this.fontColor;
      ctx.fillText(line, x, lineY);
    });
  }

  async generateCaptions(options: CaptionOptions): Promise<string[]> {
    const { text, duration, width, height, orientation } = options;

    if (orientation === 'portrait') {
      // For portrait, split into words and create a frame for each word
      const words = text.split(' ');
      const frameTimePerWord = duration / words.length;
      
      return words.map((word) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Set font properties with bold and larger size for portrait
        ctx.font = `bold ${this.portraitFontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate text dimensions
        const maxWidth = width * 0.8;
        const wrappedText = this.wrapText(ctx, word, maxWidth);
        
        // Position text near bottom
        const y = height - 250;
        
        // Draw text with background
        this.drawTextWithBackground(ctx, wrappedText, width / 2, y, maxWidth, true);

        return canvas.toDataURL();
      });
    } else {
      // For landscape, show the entire text at the bottom
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Set font properties
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate text dimensions
      const maxWidth = width * 0.8;
      const wrappedText = this.wrapText(ctx, text, maxWidth);
      
      // Position text near bottom
      const y = height - (wrappedText.length * this.fontSize * 1.2) + 20;
      
      // Draw text with background
      this.drawTextWithBackground(ctx, wrappedText, width / 2, y, maxWidth, false);

      return [canvas.toDataURL()];
    }
  }

  async getFrameData(dataUrl: string): Promise<Uint8Array> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

export const captionService = new CaptionService(); 