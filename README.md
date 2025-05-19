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

## Browser Requirements

This application uses modern web features for video processing:

- **SharedArrayBuffer**: Required for FFmpeg WebAssembly processing
- **Service Workers**: Used to set security headers needed for SharedArrayBuffer
- **Secure Context**: Must be accessed via HTTPS or localhost

**Supported browsers:** Latest versions of Chrome, Edge, Firefox, and Safari.

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
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

### GitHub Pages Deployment

This application is configured for GitHub Pages deployment with custom domain support.

1. Update the repository settings in `package.json` with your username:
```json
"homepage": "https://yourusername.github.io/shortslab/",
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/shortslab"
}
```

2. For a custom domain, set your domain in `CNAME` and `vite.config.ts`.

3. Deploy to GitHub Pages:
```bash
npm run deploy
```

The deployment workflow will:
- Build the application
- Copy FFmpeg files to the correct location
- Set up service worker for security headers
- Configure proper MIME types for WebAssembly files

### Security Headers for SharedArrayBuffer

This application requires these security headers for SharedArrayBuffer:

- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: cross-origin

The service worker applies these headers automatically to enable SharedArrayBuffer.

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