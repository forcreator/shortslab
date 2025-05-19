export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  FFMPEG_INIT: 'FFMPEG_INIT_ERROR',
  IMAGE_GEN: 'IMAGE_GENERATION_ERROR',
  AUDIO_GEN: 'AUDIO_GENERATION_ERROR',
  VIDEO_GEN: 'VIDEO_GENERATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR'
} as const;

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('SharedArrayBuffer')) {
      return new AppError(
        'SharedArrayBuffer is not available. Please ensure COEP and COOP headers are set correctly.',
        ErrorCodes.FFMPEG_INIT
      );
    }

    if (error.message.includes('secure context')) {
      return new AppError(
        'FFmpeg requires a secure context (HTTPS or localhost)',
        ErrorCodes.FFMPEG_INIT
      );
    }

    // Check for CORS errors
    if (
      error.message.includes('CORS') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('cross-origin')
    ) {
      return new AppError(
        'CORS error detected when loading FFmpeg. Please ensure FFmpeg files are available locally in public/ffmpeg directory.',
        ErrorCodes.FFMPEG_INIT,
        { originalError: error }
      );
    }

    // Generic error
    return new AppError(
      error.message,
      ErrorCodes.NETWORK,
      { originalError: error }
    );
  }

  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    ErrorCodes.NETWORK,
    { originalError: error }
  );
}

export function getErrorMessage(error: unknown): string {
  const appError = handleError(error);
  return appError.message;
} 