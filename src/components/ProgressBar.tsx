import React from 'react';

interface ProgressBarProps {
  progress: number;
  stage: 'idle' | 'image' | 'audio' | 'video';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  stage,
  className = '' 
}) => {
  const stageMessages = {
    idle: 'Preparing...',
    image: 'Generating Video...',
    audio: 'Generating Video...',
    video: 'Creating Video...'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 text-center">
        {stageMessages[stage]} ({Math.round(progress)}%)
      </p>
    </div>
  );
};

export default ProgressBar; 
