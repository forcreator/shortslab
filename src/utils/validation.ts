import { TEXT_CONFIG, VIDEO_CONFIG, IMAGE_CONFIG } from './constants';
import { AppError, ErrorCodes } from './errorHandler';

export function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new AppError(
      'Prompt is required',
      ErrorCodes.VALIDATION
    );
  }

  if (prompt.length < TEXT_CONFIG.MIN_LENGTH) {
    throw new AppError(
      `Prompt must be at least ${TEXT_CONFIG.MIN_LENGTH} characters long`,
      ErrorCodes.VALIDATION
    );
  }

  if (prompt.length > TEXT_CONFIG.MAX_LENGTH) {
    throw new AppError(
      `Prompt must not exceed ${TEXT_CONFIG.MAX_LENGTH} characters`,
      ErrorCodes.VALIDATION
    );
  }
}

export function validateDuration(duration: number): void {
  if (typeof duration !== 'number' || isNaN(duration)) {
    throw new AppError(
      'Duration must be a valid number',
      ErrorCodes.VALIDATION
    );
  }

  if (duration < VIDEO_CONFIG.MIN_DURATION) {
    throw new AppError(
      `Duration must be at least ${VIDEO_CONFIG.MIN_DURATION} seconds`,
      ErrorCodes.VALIDATION
    );
  }

  if (duration > VIDEO_CONFIG.MAX_DURATION) {
    throw new AppError(
      `Duration must not exceed ${VIDEO_CONFIG.MAX_DURATION} seconds`,
      ErrorCodes.VALIDATION
    );
  }
}

export function validateOrientation(orientation: 'portrait' | 'landscape'): void {
  if (!['portrait', 'landscape'].includes(orientation)) {
    throw new AppError(
      'Orientation must be either "portrait" or "landscape"',
      ErrorCodes.VALIDATION
    );
  }
}

export function validateImageStyle(style: string): void {
  if (!IMAGE_CONFIG.STYLES.includes(style as any)) {
    throw new AppError(
      `Style must be one of: ${IMAGE_CONFIG.STYLES.join(', ')}`,
      ErrorCodes.VALIDATION
    );
  }
} 