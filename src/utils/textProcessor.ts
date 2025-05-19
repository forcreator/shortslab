interface ProcessedText {
  sentences: string[];
  totalSentences: number;
}

export const processText = (text: string): ProcessedText => {
  // Split text into sentences using regex
  // This regex handles common sentence endings (.!?) and maintains proper spacing
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|') // Replace sentence endings followed by space with a delimiter
    .split('|') // Split on the delimiter
    .map(sentence => sentence.trim()) // Remove extra whitespace
    .filter(sentence => sentence.length > 0); // Remove empty sentences

  return {
    sentences,
    totalSentences: sentences.length
  };
};

// Helper function to estimate duration for a sentence
export const estimateSentenceDuration = (sentence: string): number => {
  // Average reading speed: ~150 words per minute
  // Convert to seconds per word
  const wordsPerSecond = 2.5;
  const wordCount = sentence.split(/\s+/).length;
  return Math.max(3, Math.ceil(wordCount / wordsPerSecond)); // Minimum 3 seconds per sentence
};

// Helper function to chunk sentences into manageable groups
export const chunkSentences = (sentences: string[], maxChunkSize: number = 3): string[][] => {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const sentence of sentences) {
    currentChunk.push(sentence);
    
    if (currentChunk.length >= maxChunkSize) {
      chunks.push([...currentChunk]);
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}; 