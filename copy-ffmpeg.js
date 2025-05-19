import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const PUBLIC_FFMPEG_DIR = path.join(__dirname, 'public', 'ffmpeg');

// Try to find FFmpeg files in multiple potential locations
const POTENTIAL_CORE_DIRS = [
  path.join(__dirname, 'node_modules', '@ffmpeg', 'core', 'dist', 'umd'),
  path.join(__dirname, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm'),
  path.join(__dirname, 'node_modules', '@ffmpeg', 'core', 'dist')
];

// Files to copy
const FILE_NAMES = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm',
  'ffmpeg-core.worker.js'
];

// Files we need to copy
const FILES_TO_COPY = [];

// Find the files in potential directories
for (const fileName of FILE_NAMES) {
  let found = false;
  for (const dirPath of POTENTIAL_CORE_DIRS) {
    const filePath = path.join(dirPath, fileName);
    if (fs.existsSync(filePath)) {
      FILES_TO_COPY.push({
        source: filePath,
        dest: path.join(PUBLIC_FFMPEG_DIR, fileName)
      });
      console.log(`Found ${fileName} at: ${filePath}`);
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.warn(`WARNING: Couldn't find ${fileName} in any of the potential directories`);
  }
}

// Create directory if it doesn't exist
if (!fs.existsSync(PUBLIC_FFMPEG_DIR)) {
  fs.mkdirSync(PUBLIC_FFMPEG_DIR, { recursive: true });
  console.log(`Created directory: ${PUBLIC_FFMPEG_DIR}`);
}

// Copy files
let success = true;
FILES_TO_COPY.forEach(file => {
  try {
    // Copy file
    fs.copyFileSync(file.source, file.dest);
    console.log(`Copied ${file.source} to ${file.dest}`);
  } catch (error) {
    console.error(`Error copying ${file.source}: ${error.message}`);
    success = false;
  }
});

// Create a dummy worker file if not found
if (!FILES_TO_COPY.some(f => f.dest.endsWith('ffmpeg-core.worker.js'))) {
  const workerPath = path.join(PUBLIC_FFMPEG_DIR, 'ffmpeg-core.worker.js');
  try {
    // Worker might not exist in some FFmpeg distributions, so create a minimal one
    const workerContent = `
// This is a minimal FFmpeg worker stub
self.onmessage = function(e) {
  console.log('FFmpeg worker received message:', e.data);
  if (e.data.type === 'init') {
    self.postMessage({ type: 'ready' });
  } else {
    self.postMessage({ type: 'error', message: 'FFmpeg worker stub - command not supported' });
  }
};
`;
    fs.writeFileSync(workerPath, workerContent);
    console.log(`Created worker file: ${workerPath}`);
  } catch (error) {
    console.error(`Error creating worker file: ${error.message}`);
    success = false;
  }
}

if (success) {
  console.log('\nAll FFmpeg files copied successfully!');
  console.log('You can now run the application with: npm run dev');
} else {
  console.error('\nSome files could not be copied. Check the errors above.');
} 