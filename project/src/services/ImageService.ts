import axios from 'axios';

type ImageStyle = 'realistic' | 'cartoon' | 'anime' | 'cyberpunk';
type ImageOrientation = 'portrait' | 'landscape';

interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: ImageStyle;
  orientation?: ImageOrientation;
  shouldCrop?: boolean;
}

export class ImageService {
  private readonly baseUrl = 'https://image.pollinations.ai/prompt/';
  private readonly defaultOptions: Partial<ImageGenerationOptions> = {
    width: 1920,
    height: 1080,
    style: 'realistic',
    orientation: 'landscape',
    shouldCrop: true
  };

  private getStylePrompt(style: ImageStyle): string {
    switch (style) {
      case 'realistic':
        return 'realistic, detailed, photorealistic, high quality, 4k, sharp focus';
      case 'cartoon':
        return 'cartoon style, vibrant colors, simple shapes, clean lines, high quality';
      case 'anime':
        return 'anime style, manga art, cel shaded, vibrant, detailed anime illustration';
      case 'cyberpunk':
        return 'cyberpunk style, neon colors, futuristic, high tech, dystopian, detailed';
      default:
        return '';
    }
  }

  private getDimensions(orientation: ImageOrientation): { width: number; height: number } {
    switch (orientation) {
      case 'portrait':
        return { width: 1080, height: 1920 }; // 9:16 ratio for vertical video
      case 'landscape':
        return { width: 1920, height: 1080 }; // 16:9 ratio for horizontal video
      default:
        return this.defaultOptions as { width: number; height: number };
    }
  }

  private async cropImage(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to match original image
        canvas.width = img.width;
        canvas.height = img.height;

        // Calculate crop dimensions (10% from each edge)
        const cropX = img.width * 0.1;
        const cropY = img.height * 0.1;
        const cropWidth = img.width * 0.8;
        const cropHeight = img.height * 0.8;

        // Draw the cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rectangle
          0, 0, canvas.width, canvas.height     // Destination rectangle
        );

        // Convert to data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        resolve(croppedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };

      img.src = imageUrl;
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<string> {
    try {
      const style = options.style || this.defaultOptions.style || 'realistic';
      const orientation = options.orientation || this.defaultOptions.orientation || 'landscape';
      const shouldCrop = options.shouldCrop ?? this.defaultOptions.shouldCrop;
      const dimensions = this.getDimensions(orientation);
      
      const {
        prompt,
        width = dimensions.width,
        height = dimensions.height,
      } = options;

      // Combine user prompt with style prompt
      const stylePrompt = this.getStylePrompt(style);
      const aspectRatioPrompt = orientation === 'portrait'
        ? 'vertical portrait composition, full body vertical shot'
        : 'horizontal landscape composition, wide cinematic shot';
      
      const fullPrompt = `${prompt}, ${stylePrompt}, ${aspectRatioPrompt}, high quality, detailed`;
      const encodedPrompt = encodeURIComponent(fullPrompt);

      // Construct URL with width and height as query parameters
      const url = `${this.baseUrl}${encodedPrompt}?width=${width}&height=${height}&format=png`;

      console.log('Generating image with:', {
        orientation,
        dimensions: `${width}x${height}`,
        fullPrompt,
        url
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/png'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image generation failed:', errorText);
        throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('image/')) {
        const errorText = await response.text();
        console.error('Invalid response type:', contentType, errorText);
        throw new Error('Server returned invalid content type');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Apply cropping if enabled
      if (shouldCrop) {
        try {
          const croppedUrl = await this.cropImage(imageUrl);
          // Clean up the original blob URL
          URL.revokeObjectURL(imageUrl);
          return croppedUrl;
        } catch (error) {
          console.error('Cropping failed, returning original image:', error);
          return imageUrl;
        }
      }

      return imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}

export const imageService = new ImageService(); 