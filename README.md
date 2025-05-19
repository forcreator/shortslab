# Shorts Lab for Creators

A powerful web application for creating engaging short-form videos with AI-generated images, text-to-speech audio, and synchronized captions.

## Features

- 🎨 AI Image Generation with multiple styles (Realistic, Cartoon, Anime, Cyberpunk)
- 🔊 Text-to-Speech audio generation
- 📝 Automatic caption generation and synchronization
- 📱 Support for both Portrait (9:16) and Landscape (16:9) formats
- 🎬 FFmpeg-powered video processing
- 🎯 Easy-to-use interface

## Tech Stack

- React + TypeScript
- Vite
- FFmpeg WebAssembly
- TailwindCSS
- Google Text-to-Speech
- Pollinations AI for image generation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shortslab.git
cd shortslab
```

2. Install dependencies:
```bash
cd project
npm install
```

3. Download FFmpeg files:

You need to download the following files and place them in the `public/ffmpeg` directory:

- ffmpeg-core.js: https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js
- ffmpeg-core.wasm: https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm
- ffmpeg-core.worker.js: https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js

You can download these manually or use curl/wget:

```bash
# Create directory
mkdir -p public/ffmpeg

# Download files
curl -o public/ffmpeg/ffmpeg-core.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js
curl -o public/ffmpeg/ffmpeg-core.wasm https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm 
curl -o public/ffmpeg/ffmpeg-core.worker.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. Enter your prompt text
2. Select your preferred style (Realistic, Cartoon, Anime, Cyberpunk)
3. Choose orientation (Portrait for vertical shorts, Landscape for horizontal videos)
4. Toggle captions on/off as needed
5. Click "Generate Video" and wait for the magic to happen!
6. Download your generated video, image, or audio files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## CORS and Security Headers

This application requires specific security headers to be set on the server:

- Cross-Origin-Embedder-Policy (COEP): require-corp
- Cross-Origin-Opener-Policy (COOP): same-origin

These headers are needed for SharedArrayBuffer to work, which is required by FFmpeg.

## CORS Issue Solution

This web application uses FFmpeg for video processing, which requires loading WebAssembly modules. You need to place the FFmpeg files in your public directory:

### Step 1: Create the ffmpeg directory

```bash
mkdir -p public/ffmpeg
```

### Step 2: Download the FFmpeg files

1. Right-click on each of these links and select "Save Link As..." to save to the public/ffmpeg directory:

   - [ffmpeg-core.js](https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js) → save as `public/ffmpeg/ffmpeg-core.js`
   - [ffmpeg-core.wasm](https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm) → save as `public/ffmpeg/ffmpeg-core.wasm` 
   - [ffmpeg-core.worker.js](https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js) → save as `public/ffmpeg/ffmpeg-core.worker.js`

2. If the links above don't work or return 404s, you can extract these files from the node_modules directory:

```bash
# Copy from node_modules to public directory
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.js public/ffmpeg/
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm public/ffmpeg/
cp node_modules/@ffmpeg/core/dist/ffmpeg-core.worker.js public/ffmpeg/
```

### Step 3: Restart your dev server

After placing the files in the correct location, restart your development server:

```bash
npm run dev
```

NOTE: These files in the public directory are accessed directly by the browser at runtime. They are not imported in the source code. 