import React, { useEffect, useState } from 'react';
import { imageService } from '../services/ImageService';
import { audioService } from '../services/AudioService';
import { videoService } from '../services/VideoService';

interface VideoGeneratorProps {
  prompt: string;
  onComplete: (videoUrl: string) => void;
}

interface ProgressState {
  stage: 'image' | 'audio' | 'video' | 'idle';
  percent: number;
  message: string;
  details?: string;
}

interface GeneratedFiles {
  image?: string;
  audio?: string;
  video?: string;
}

type ImageStyle = 'realistic' | 'cartoon' | 'anime' | 'cyberpunk';
type ImageOrientation = 'portrait' | 'landscape';

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ prompt, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({});
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('realistic');
  const [selectedOrientation, setSelectedOrientation] = useState<ImageOrientation>('landscape');
  const [includeCaptions, setIncludeCaptions] = useState(true);
  const [progress, setProgress] = useState<ProgressState>({
    stage: 'idle',
    percent: 0,
    message: ''
  });

  const addDebugMessage = (message: string) => {
    setDebug(prev => [...prev, message]);
    console.log(`Debug: ${message}`);
  };

  const updateProgress = (stage: ProgressState['stage'], percent: number, message: string, details?: string) => {
    setProgress({ stage, percent, message, details });
    addDebugMessage(`${stage.toUpperCase()}: ${message} ${details ? `(${details})` : ''} (${percent}%)`);
  };

  useEffect(() => {
    if (!crossOriginIsolated) {
      setError('Cross-Origin Isolation is not enabled. Please check server configuration.');
      return;
    }

    updateProgress('idle', 0, 'Ready to generate');
    
    // Initialize video service with progress callback
    videoService.initialize()
      .then(() => {
        // Add progress listener
        videoService.onProgress((stage, percent, message) => {
          updateProgress(stage, percent, message);
        });
      })
      .catch(error => {
        setError(`Failed to initialize FFmpeg: ${error.message}`);
      });

    return () => {
      videoService.dispose();
    };
  }, []);

  const handleVideoComplete = (videoUrl: string) => {
    addDebugMessage(`Video URL created: ${videoUrl}`);
    // Create a test video element to verify the blob
    const testVideo = document.createElement('video');
    testVideo.preload = 'metadata';
    
    testVideo.onloadedmetadata = () => {
      addDebugMessage(`Video duration: ${testVideo.duration}s`);
      addDebugMessage(`Video dimensions: ${testVideo.videoWidth}x${testVideo.videoHeight}`);
      onComplete(videoUrl);
    };

    testVideo.onerror = () => {
      const error = testVideo.error;
      addDebugMessage(`Video load error: ${error?.message || 'Unknown error'}`);
      setError(`Failed to load video: ${error?.message || 'Unknown error'}`);
      URL.revokeObjectURL(videoUrl);
    };

    testVideo.src = videoUrl;
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);
      setGeneratedFiles({});
      addDebugMessage('Starting video generation process');

      // Step 1: Generate image with style and orientation
      updateProgress('image', 0, 'Starting image generation');
      const imageStartTime = Date.now();
      const imageUrl = await imageService.generateImage({
        prompt,
        style: selectedStyle,
        orientation: selectedOrientation
      });
      setGeneratedFiles(prev => ({ ...prev, image: imageUrl }));
      updateProgress('image', 50, `Image generated in ${(Date.now() - imageStartTime) / 1000}s`);
      
      // Convert image URL to Uint8Array with proper validation
      let imageData: Uint8Array;
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        
        const contentType = imageResponse.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content type received: ${contentType}`);
        }

        const imageBlob = await imageResponse.blob();
        if (imageBlob.size === 0) {
          throw new Error('Received empty image data');
        }

        addDebugMessage(`Image blob type: ${imageBlob.type}, size: ${imageBlob.size} bytes`);

        const imageBuffer = await imageBlob.arrayBuffer();
        imageData = new Uint8Array(imageBuffer);
        
        // Log first few bytes for debugging
        const firstBytes = Array.from(imageData.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');
        addDebugMessage(`Image first bytes: ${firstBytes}`);

        // More lenient image validation
        if (imageData.length < 8) {
          throw new Error(`Image data too small: ${imageData.length} bytes`);
        }

        // Check content type instead of magic numbers
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(imageBlob.type)) {
          addDebugMessage(`Warning: Unexpected image type: ${imageBlob.type}`);
          // Continue anyway as the data might still be valid
        }

        // Basic sanity check for image data
        let isValidImage = false;
        
        // Check for PNG
        if (imageData[0] === 0x89 && 
            imageData[1] === 0x50 && // P
            imageData[2] === 0x4E && // N
            imageData[3] === 0x47) { // G
          isValidImage = true;
          addDebugMessage('Detected PNG format');
        }
        
        // Check for JPEG
        if (imageData[0] === 0xFF && 
            imageData[1] === 0xD8) {
          isValidImage = true;
          addDebugMessage('Detected JPEG format');
        }

        // If neither format is detected but we have data, try to proceed anyway
        if (!isValidImage) {
          addDebugMessage('Warning: Image format not recognized, but proceeding with data');
        }
      } catch (error) {
        addDebugMessage(`Image processing error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Failed to process image data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      updateProgress('image', 100, 'Image processing completed');

      // Step 2: Generate audio
      updateProgress('audio', 0, 'Starting speech synthesis');
      const audioStartTime = Date.now();
      const audioResult = await audioService.generateAudio({
        text: prompt,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      setGeneratedFiles(prev => ({ ...prev, audio: audioResult.url }));
      updateProgress('audio', 50, `Audio generated in ${(Date.now() - audioStartTime) / 1000}s`);

      // Get audio data with validation
      const audioData = await audioService.getAudioData(audioResult.url);
      if (!audioData || audioData.length === 0) {
        throw new Error('Invalid audio data received');
      }
      addDebugMessage(`Audio duration: ${audioResult.duration}s`);
      updateProgress('audio', 100, 'Audio processing completed');

      // Step 3: Generate video
      updateProgress('video', 0, 'Starting video creation');
      const videoStartTime = Date.now();
      
      // Calculate exact number of frames needed for the audio duration
      const fps = 30; // Standard frame rate
      const totalFrames = Math.ceil(audioResult.duration * fps);
      addDebugMessage(`Generating video with ${totalFrames} frames at ${fps} fps`);

      // Get dimensions based on orientation
      const dimensions = selectedOrientation === 'portrait' 
        ? { width: 1080, height: 1920 }  // 9:16 ratio
        : { width: 1920, height: 1080 }; // 16:9 ratio

      addDebugMessage(`Video dimensions: ${dimensions.width}x${dimensions.height}`);

      const videoUrl = await videoService.generateVideo({
        imageData,
        audioData,
        duration: audioResult.duration,
        text: includeCaptions ? prompt : '',
        fps,
        totalFrames,
        width: dimensions.width,
        height: dimensions.height,
        orientation: selectedOrientation
      });

      if (!videoUrl) {
        throw new Error('No video URL received from video service');
      }

      updateProgress('video', 100, `Video created in ${(Date.now() - videoStartTime) / 1000}s`);
      addDebugMessage(`Generated video duration: ${audioResult.duration}s`);

      // Clean up audio resources
      audioService.cleanup(audioResult.url);

      const totalTime = (Date.now() - startTime) / 1000;
      addDebugMessage(`Total processing time: ${totalTime}s`);
      setGeneratedFiles(prev => ({ ...prev, video: videoUrl }));
      handleVideoComplete(videoUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      setError(errorMessage);
      addDebugMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setProgress({ stage: 'idle', percent: 0, message: 'Ready to generate' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Style</label>
          <div className="relative group">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as ImageStyle)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-white/5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white group-hover:border-purple-500/20 transition-all duration-200"
              disabled={isLoading}
            >
              <option value="realistic">Realistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="anime">Anime</option>
              <option value="cyberpunk">Cyberpunk</option>
            </select>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 -z-10 group-hover:opacity-100 opacity-0 transition-opacity duration-200" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Orientation</label>
          <div className="relative group">
            <select
              value={selectedOrientation}
              onChange={(e) => setSelectedOrientation(e.target.value as ImageOrientation)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-white/5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white group-hover:border-purple-500/20 transition-all duration-200"
              disabled={isLoading}
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 -z-10 group-hover:opacity-100 opacity-0 transition-opacity duration-200" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="includeCaptions"
          checked={includeCaptions}
          onChange={(e) => setIncludeCaptions(e.target.checked)}
          className="w-4 h-4 rounded border-white/5 bg-gray-900/50 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
          disabled={isLoading}
        />
        <label htmlFor="includeCaptions" className="text-sm font-medium text-gray-200">
          Include Captions
        </label>
      </div>

      {error && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
          <div className="relative text-red-400 text-sm bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setError(null);
                videoService.initialize();
              }}
              className="text-red-400 hover:text-red-300 underline text-sm ml-4 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <button
        onClick={generateVideo}
        disabled={isLoading}
        className={`relative w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-white font-medium flex items-center justify-center space-x-2 transition-all duration-300 border border-white/5 shadow-lg group ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {isLoading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            {progress.stage !== 'idle' && (
              <div className="flex flex-col items-center">
                <span className="text-white/90">{progress.message}</span>
                {progress.details && (
                  <span className="text-xs text-white/60">{progress.details}</span>
                )}
                <span className="text-sm text-white/60">{progress.percent}%</span>
              </div>
            )}
          </>
        ) : (
          <span className="relative">Generate Video</span>
        )}
      </button>

      {/* Download buttons */}
      {Object.entries(generatedFiles).length > 0 && (
        <div className="flex flex-col space-y-4 mt-8">
          <h3 className="text-lg font-semibold text-gray-200">Generated Files</h3>
          <div className="grid grid-cols-3 gap-4">
            {generatedFiles.image && (
              <button
                onClick={() => handleDownload(generatedFiles.image!, 'generated-image.png')}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-white rounded-xl text-sm font-medium border border-white/5 shadow-lg transition-all duration-300 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Download Image</span>
              </button>
            )}
            {generatedFiles.audio && (
              <button
                onClick={() => handleDownload(generatedFiles.audio!, 'generated-audio.mp3')}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-white rounded-xl text-sm font-medium border border-white/5 shadow-lg transition-all duration-300 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Download Audio</span>
              </button>
            )}
            {generatedFiles.video && (
              <button
                onClick={() => handleDownload(generatedFiles.video!, 'generated-video.mp4')}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-white rounded-xl text-sm font-medium border border-white/5 shadow-lg transition-all duration-300 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Download Video</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator; 