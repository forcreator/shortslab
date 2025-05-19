import React, { useState, useEffect } from 'react';
import VideoGenerator from './components/VideoGenerator';
import { videoService } from './services/VideoService';

function App() {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const MAX_CHARS = 1800; // Increased to ~180 words (assuming average word length of 10 characters)

  useEffect(() => {
    // Suppress the cross-origin isolation warning
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.('Cross-Origin-Isolation')) return;
      originalConsoleWarn.apply(console, args);
    };

    const initFFmpeg = async () => {
      try {
        await videoService.initialize();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize video processing. Please try reloading the page.');
        setIsLoading(false);
      }
    };

    initFFmpeg();

    // Cleanup
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setPrompt(text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing video processing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-4">Initialization Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05),transparent_40%,rgba(255,255,255,0.05))] animate-pulse-slow pointer-events-none" />
      
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50" />

      <div className="relative max-w-4xl mx-auto px-4 py-16">
        {/* Logo and Title */}
        <div className="text-center mb-16 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          <h1 className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white mb-3 relative">
            SHORTS LAB
          </h1>
          <p className="text-gray-400 text-lg font-light">Transform Your Stories into Cinematic Shorts</p>
        </div>

        <div className="relative">
          {/* Background blur effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-lg" />
          
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="prompt" className="block text-lg font-medium mb-3 text-gray-200">
                  Enter your story or content
                </label>
                <div className="relative group">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    className="w-full p-4 rounded-xl bg-gray-900/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none border border-white/5 resize-none transition-all duration-200 group-hover:border-purple-500/20 min-h-[200px]"
                    placeholder="Write your story or content here (up to 180 words)..."
                    rows={8}
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                    {prompt.length}/{MAX_CHARS} characters
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Write a complete story or content in a single paragraph. The system will automatically break it into appropriate segments for the video.
                </p>
              </div>

              <VideoGenerator
                prompt={prompt}
                onComplete={(url) => setVideoUrl(url)}
              />
            </form>

            {videoUrl && (
              <div className="mt-10 space-y-6">
                <h2 className="text-xl font-semibold text-gray-200">Generated Video</h2>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-xl shadow-2xl border border-white/5 bg-black/50"
                />
                <a
                  href={videoUrl}
                  download="generated-video.mp4"
                  className="block w-full text-center py-3 px-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl transition-all duration-300 font-medium border border-white/5 shadow-lg"
                >
                  Download Video
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;