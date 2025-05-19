import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { captionService } from './CaptionService';

interface VideoGenerationOptions {
  imageData: Uint8Array;
  audioData: Uint8Array;
  duration: number;
  text: string;
  fps: number;
  totalFrames: number;
  width: number;
  height: number;
  orientation?: 'portrait' | 'landscape';
}

interface CombineVideosOptions {
  videoUrls: string[];
  orientation: 'portrait' | 'landscape';
}

type ProgressCallback = (stage: 'image' | 'audio' | 'video' | 'idle', percent: number, message: string) => void;

export class VideoService {
  private ffmpeg: FFmpeg;
  private progressCallback?: ProgressCallback;
  private isInitialized = false;

  constructor() {
    // Configure FFmpeg with minimal logging
    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on('log', () => {}); // Suppress log messages
  }

  // Get the base path for GitHub Pages or custom domain
  private getBasePath(): string {
    // Check if we're on a custom domain
    if (window.location.hostname === 'shorts.forcreator.space') {
      return ''; // No base path needed for custom domain
    }
    
    // Get the repository name from the pathname (for GitHub Pages)
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length > 1 && window.location.hostname.indexOf('github.io') !== -1) {
      return '/' + pathSegments[1]; // Return repo name with leading slash
    }
    
    return ''; // Return empty string for root
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if SharedArrayBuffer is available
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error('SharedArrayBuffer is not available. Please ensure COEP and COOP headers are set correctly.');
      }

      // Check if running in a secure context
      if (!window.isSecureContext) {
        throw new Error('FFmpeg requires a secure context (HTTPS or localhost)');
      }

      // Check headers for COEP and COOP
      const response = await fetch(window.location.href);
      const coep = response.headers.get('Cross-Origin-Embedder-Policy');
      const coop = response.headers.get('Cross-Origin-Opener-Policy');
      
      if (coep !== 'require-corp' || coop !== 'same-origin') {
        console.warn('Security headers not properly set:', { coep, coop });
      }

      console.log('Initializing FFmpeg...');
      
      // Create new FFmpeg instance with minimal configuration
      this.ffmpeg = new FFmpeg();
      
      // Set up logging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg Log:', message);
      });
      
      // Set up progress logging
      this.ffmpeg.on('progress', ({ progress }) => {
        console.log(`FFmpeg Progress: ${Math.round(progress * 100)}%`);
      });

      // Get the base URL for loading local files
      const baseURL = window.location.origin;
      const basePath = this.getBasePath();
      console.log('Loading FFmpeg files from:', baseURL + basePath);
      
      try {
        // First try the simple load method (which searches in standard locations)
        console.log('Attempting simple FFmpeg load...');
        await this.ffmpeg.load();
        console.log('Simple FFmpeg load succeeded');
      } catch (simpleLoadError) {
        console.warn('Simple FFmpeg load failed, trying with explicit paths:', simpleLoadError);
        
        // If simple load fails, try with explicit paths and CORS settings
        await this.ffmpeg.load({
          coreURL: `${baseURL}${basePath}/ffmpeg/ffmpeg-core.js`,
          wasmURL: `${baseURL}${basePath}/ffmpeg/ffmpeg-core.wasm`,
          workerURL: `${baseURL}${basePath}/ffmpeg/ffmpeg-core.worker.js`
        });
        console.log('Explicit path FFmpeg load succeeded');
      }
      
      this.isInitialized = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error(`FFmpeg initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  onProgress(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  private reportProgress(message: string, percent: number) {
    if (this.progressCallback) {
      this.progressCallback('video', percent, message);
    }
    console.log(`Video progress: ${message} (${percent}%)`);
  }

  async generateVideo(options: VideoGenerationOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      imageData,
      audioData,
      duration,
      text,
      fps,
      totalFrames,
      width,
      height,
      orientation = 'landscape'
    } = options;

    let captionFrames: string[] = [];

    try {
      this.reportProgress('Initializing video generation', 0);

      // Generate caption frames
      this.reportProgress('Generating captions', 10);
      captionFrames = await captionService.generateCaptions({
        text,
        duration,
        width,
        height,
        orientation
      });

      // Write base image and audio
      this.reportProgress('Preparing media files', 20);
      await this.ffmpeg.writeFile('image.png', imageData);
      await this.ffmpeg.writeFile('audio.mp3', audioData);

      // Write all caption frames
      for (let i = 0; i < captionFrames.length; i++) {
        const frameData = await captionService.getFrameData(captionFrames[i]);
        await this.ffmpeg.writeFile(`caption_${i}.png`, frameData);
      }

      // Create video with captions
      this.reportProgress('Generating video', 30);

      let filterComplex = '';
      if (orientation === 'portrait') {
        // For portrait mode, create a chain of overlays with enable filters
        const timePerCaption = duration / captionFrames.length;
        
        // Start with the base image
        filterComplex = '[0:v]';
        
        // Add each caption with its time window
        for (let i = 0; i < captionFrames.length; i++) {
          const startTime = i * timePerCaption;
          const endTime = (i === captionFrames.length - 1) ? duration : (i + 1) * timePerCaption;
          
          filterComplex += `[${i + 1}:v]overlay=x=(W-w)/2:y=H-h-100:enable='between(t,${startTime},${endTime})'`;
          if (i < captionFrames.length - 1) {
            filterComplex += `[v${i}];[v${i}]`;
          }
        }
        
        // Add the final output label
        filterComplex += '[v]';
      } else {
        // For landscape mode, simple centered overlay
        filterComplex = '[0:v][1:v]overlay=x=(W-w)/2:y=H-h-100[v]';
      }

      // Build FFmpeg command
      const ffmpegCommand = [
        '-r', String(fps),           // Input frame rate
        '-loop', '1',                // Loop the input image
        '-i', 'image.png',           // Base image
      ];

      // Add inputs for all caption frames
      for (let i = 0; i < captionFrames.length; i++) {
        ffmpegCommand.push('-i', `caption_${i}.png`);
      }

      // Add audio input and remaining parameters
      ffmpegCommand.push(
        '-i', 'audio.mp3',           // Audio file
        '-filter_complex', filterComplex,
        '-map', '[v]',               // Use the video output
        '-map', `${captionFrames.length + 1}:a`,  // Map audio from the last input
        '-c:v', 'libx264',           // Video codec
        '-profile:v', 'main',        // More compatible profile
        '-preset', 'ultrafast',      // Fast encoding
        '-tune', 'stillimage',       // Optimize for still image input
        '-c:a', 'aac',              // Audio codec
        '-b:a', '192k',             // Audio bitrate
        '-pix_fmt', 'yuv420p',      // Ensure compatibility
        '-shortest',                 // Match the shortest input
        '-t', String(duration),      // Duration
        '-movflags', '+faststart',   // Enable fast start
        '-y',                        // Overwrite output
        'output.mp4'
      );

      // Execute FFmpeg command
      await this.ffmpeg.exec(ffmpegCommand);

      // Read the output video
      this.reportProgress('Processing final video', 90);
      const data = await this.ffmpeg.readFile('output.mp4');

      // Clean up files
      this.reportProgress('Cleaning up', 95);
      
      // Clean up in separate try-catch blocks
      const filesToClean = [
        'image.png',
        'audio.mp3',
        'output.mp4',
        ...Array.from({ length: captionFrames.length }, (_, i) => `caption_${i}.png`)
      ];

      for (const file of filesToClean) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch {
          console.warn(`Failed to delete ${file}`);
        }
      }

      this.reportProgress('Video generation complete', 100);

      // Create blob with explicit MIME type
      const videoBlob = new Blob([data], { type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' });
      return URL.createObjectURL(videoBlob);
    } catch (error) {
      console.error('Error generating video:', error);
      
      // Emergency cleanup
      const filesToClean = [
        'image.png',
        'audio.mp3',
        'output.mp4',
        ...Array.from({ length: captionFrames.length }, (_, i) => `caption_${i}.png`)
      ];

      for (const file of filesToClean) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch {}
      }

      throw new Error('Failed to generate video: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async combineVideos(options: CombineVideosOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { videoUrls, orientation } = options;
    const dimensions = orientation === 'portrait' 
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 };

    try {
      this.reportProgress('Starting video combination', 0);

      // Download all video segments
      const videoData: Uint8Array[] = [];
      for (let i = 0; i < videoUrls.length; i++) {
        this.reportProgress(`Downloading segment ${i + 1}/${videoUrls.length}`, (i / videoUrls.length) * 30);
        const response = await fetch(videoUrls[i]);
        const blob = await response.blob();
        const data = new Uint8Array(await blob.arrayBuffer());
        videoData.push(data);
        await this.ffmpeg.writeFile(`segment_${i}.mp4`, data);
      }

      // Create a file list for FFmpeg
      const fileList = videoUrls.map((_, i) => `file 'segment_${i}.mp4'`).join('\n');
      await this.ffmpeg.writeFile('filelist.txt', fileList);

      // Combine videos using FFmpeg concat demuxer
      this.reportProgress('Combining video segments', 40);
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'filelist.txt',
        '-c', 'copy',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      // Read the combined video
      this.reportProgress('Processing final video', 90);
      const data = await this.ffmpeg.readFile('output.mp4');

      // Clean up files
      this.reportProgress('Cleaning up', 95);
      const filesToClean = [
        'filelist.txt',
        'output.mp4',
        ...videoUrls.map((_, i) => `segment_${i}.mp4`)
      ];

      for (const file of filesToClean) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch {
          console.warn(`Failed to delete ${file}`);
        }
      }

      this.reportProgress('Video combination complete', 100);

      // Create blob with explicit MIME type
      const videoBlob = new Blob([data], { type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' });
      return URL.createObjectURL(videoBlob);
    } catch (error) {
      console.error('Error combining videos:', error);
      
      // Emergency cleanup
      const filesToClean = [
        'filelist.txt',
        'output.mp4',
        ...videoUrls.map((_, i) => `segment_${i}.mp4`)
      ];

      for (const file of filesToClean) {
        try {
          await this.ffmpeg.deleteFile(file);
        } catch {}
      }

      throw new Error('Failed to combine videos: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  dispose() {
    if (this.ffmpeg) {
      this.progressCallback = undefined;
      this.isInitialized = false;
    }
  }
}

export const videoService = new VideoService(); 