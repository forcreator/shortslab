import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fetch = require('node-fetch');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES = [
  {
    url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    destination: path.join(__dirname, 'public/ffmpeg/ffmpeg-core.js')
  },
  {
    url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm',
    destination: path.join(__dirname, 'public/ffmpeg/ffmpeg-core.wasm')
  },
  {
    url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js',
    destination: path.join(__dirname, 'public/ffmpeg/ffmpeg-core.worker.js')
  }
];

// Create directory if it doesn't exist
const directory = path.dirname(FILES[0].destination);
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
  console.log(`Created directory: ${directory}`);
}

// Download files
async function downloadFiles() {
  for (const file of FILES) {
    try {
      console.log(`Downloading ${file.url}...`);
      
      const response = await fetch(file.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://unpkg.com/'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to download ${file.url} - Status code: ${response.status}`);
        continue;
      }
      
      const buffer = await response.buffer();
      fs.writeFileSync(file.destination, buffer);
      
      console.log(`Downloaded ${file.url} to ${file.destination}`);
    } catch (error) {
      console.error(`Error downloading ${file.url}: ${error.message}`);
    }
  }
}

downloadFiles(); 