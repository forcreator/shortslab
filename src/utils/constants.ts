export const VIDEO_CONFIG = {
  MAX_DURATION: 60, // seconds
  MIN_DURATION: 5, // seconds
  DEFAULT_FPS: 30,
  PORTRAIT: {
    WIDTH: 1080,
    HEIGHT: 1920
  },
  LANDSCAPE: {
    WIDTH: 1920,
    HEIGHT: 1080
  }
} as const;

export const AUDIO_CONFIG = {
  DEFAULT_RATE: 1.0,
  DEFAULT_PITCH: 1.0,
  DEFAULT_VOLUME: 1.0,
  SUPPORTED_FORMATS: ['mp3', 'wav'] as const
} as const;

export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg'] as const,
  STYLES: ['realistic', 'cartoon', 'anime', 'cyberpunk'] as const
} as const;

export const TEXT_CONFIG = {
  MAX_LENGTH: 1800, // characters
  MIN_LENGTH: 10, // characters
  MAX_WORDS_PER_SENTENCE: 20,
  MIN_WORDS_PER_SENTENCE: 3
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
} as const; 