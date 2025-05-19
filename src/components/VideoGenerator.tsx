import React, { useState } from 'react';
import { imageService } from '../services/ImageService';
import { audioService } from '../services/AudioService';
import { videoService } from '../services/VideoService';
import { processText, estimateSentenceDuration } from '../utils/textProcessor';
import { validatePrompt, validateOrientation, validateImageStyle } from '../utils/validation';
import { handleError, getErrorMessage } from '../utils/errorHandler';
import { IMAGE_CONFIG, VIDEO_CONFIG } from '../utils/constants';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface VideoGeneratorProps {
  prompt: string;
  onComplete: (url: string) => void;
}

type ImageStyle = typeof IMAGE_CONFIG.STYLES[number];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ prompt, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<'idle' | 'image' | 'audio' | 'video'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [style, setStyle] = useState<ImageStyle>('realistic');
  const [showCaptions, setShowCaptions] = useState(true);

  const handleProgress = (stage: 'image' | 'audio' | 'video' | 'idle', percent: number, message: string) => {
    setCurrentStage(stage);
    setProgress(percent);
    console.log(`${stage}: ${message} (${percent}%)`);
  };

  const generateScene = async (sentence: string, duration: number) => {
    try {
      // Generate image for the scene
      const imageUrl = await imageService.generateImage({
        prompt: sentence,
        style,
        orientation
      });
      
      // Convert image URL to Uint8Array
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageData = new Uint8Array(await imageBlob.arrayBuffer());

      // Generate audio for the sentence
      const audioResult = await audioService.generateAudio({
        text: sentence,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });

      // Get audio data
      const audioData = await audioService.getAudioData(audioResult.url);

      // Generate video segment
      const videoUrl = await videoService.generateVideo({
        imageData,
        audioData,
        duration,
        text: showCaptions ? sentence : '',
        fps: VIDEO_CONFIG.DEFAULT_FPS,
        totalFrames: duration * VIDEO_CONFIG.DEFAULT_FPS,
        width: orientation === 'portrait' ? VIDEO_CONFIG.PORTRAIT.WIDTH : VIDEO_CONFIG.LANDSCAPE.WIDTH,
        height: orientation === 'portrait' ? VIDEO_CONFIG.PORTRAIT.HEIGHT : VIDEO_CONFIG.LANDSCAPE.HEIGHT,
        orientation
      });

      return videoUrl;
    } catch (error) {
      console.error('Error generating scene:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setCurrentStage('idle');

    try {
      // Validate inputs
      validatePrompt(prompt);
      validateOrientation(orientation);
      validateImageStyle(style);

      // Process the text into sentences
      const { sentences, totalSentences } = processText(prompt);
      console.log(`Processing ${totalSentences} sentences`);

      // Calculate durations for each sentence
      const durations = sentences.map(estimateSentenceDuration);
      
      // Generate scenes for each sentence
      const sceneUrls: string[] = [];
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const duration = durations[i];
        
        setCurrentStage('image');
        setProgress((i / totalSentences) * 50); // First 50% for scene generation
        
        const sceneUrl = await generateScene(sentence, duration);
        sceneUrls.push(sceneUrl);
      }

      // Combine all scenes into final video
      setCurrentStage('video');
      setProgress(60);
      const finalVideoUrl = await videoService.combineVideos({
        videoUrls: sceneUrls,
        orientation
      });

      // Clean up individual scene URLs
      sceneUrls.forEach(url => URL.revokeObjectURL(url));
      
      onComplete(finalVideoUrl);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
      setCurrentStage('idle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Orientation
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
            className="w-full p-2 rounded-lg bg-gray-900/50 text-white border border-white/5 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          >
            <option value="portrait">Portrait (9:16)</option>
            <option value="landscape">Landscape (16:9)</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Style
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as ImageStyle)}
            className="w-full p-2 rounded-lg bg-gray-900/50 text-white border border-white/5 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          >
            {IMAGE_CONFIG.STYLES.map(style => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Captions
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                showCaptions ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showCaptions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-400">
              {showCaptions ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {isGenerating && (
        <ProgressBar progress={progress} stage={currentStage} />
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
          isGenerating
            ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isGenerating ? (
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner size="sm" />
            <span>Generating...</span>
          </div>
        ) : (
          'Generate Video'
        )}
      </button>
    </div>
  );
};

export default VideoGenerator; 