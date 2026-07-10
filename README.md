# ARIA - Video Editor

A modern video editor built with Tauri + React + TypeScript + FFmpeg, supporting up to 8K video with proxy editing.

## Features

- **8K Video Support**: Edit videos up to 8K resolution using proxy files for smooth performance
- **3 Video Tracks**: Multi-track video editing with 3 video tracks
- **3 Audio Tracks**: Multi-track audio editing with 3 audio tracks
- **Proxy Generation**: Automatic proxy generation for high-resolution videos
- **Light/Dark Theme**: Toggle between light and dark themes
- **FFmpeg Integration**: Powerful video processing using FFmpeg
- **Cross-platform**: Build for Linux (.deb), Windows, and macOS

## Requirements

- Node.js 18+
- Rust 1.77+
- FFmpeg (must be installed on system)
- webkit2gtk (Linux)

### Linux Dependencies

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Install FFmpeg
sudo apt install ffmpeg
```

## Installation

```bash
# Install dependencies
npm install

# Initialize Tauri (if not already done)
npm run tauri init
```

## Development

```bash
# Run in development mode
npm run tauri:dev
```

## Building

### Build .deb Package (Linux)

```bash
# Build the application
npm run tauri:build

# The .deb file will be in src-tauri/target/release/bundle/deb/
```

### Build for Other Platforms

```bash
# Build for current platform
npm run tauri:build

# The output will be in src-tauri/target/release/bundle/
```

## Project Structure

All files are kept under 200 lines for maintainability:

```
src/
├── components/       # React components (max 200 lines each)
│   ├── ThemeToggle.tsx
│   ├── Track.tsx
│   ├── Timeline.tsx
│   ├── VideoPreview.tsx
│   ├── ProxyManager.tsx
│   ├── FileImporter.tsx
│   └── ExportDialog.tsx
├── hooks/           # Custom React hooks
│   ├── useTheme.ts
│   ├── useFFmpeg.ts
│   └── useProject.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
└── App.tsx          # Main application component

src-tauri/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   └── commands.rs  # FFmpeg commands
└── capabilities/    # Tauri permissions
```

## Usage

1. **Import Video**: Click "Import Video" to load a video file
2. **Generate Proxy**: Configure proxy settings and generate a proxy for smooth editing
3. **Edit Timeline**: Arrange clips on the 3 video and 3 audio tracks
4. **Preview**: Use the video preview to review your edits
5. **Export**: Choose export settings and render your final video

## Proxy Settings

- **Resolution**: 720p, 1080p, or 1440p proxy resolution
- **Codec**: H.264, H.265, or VP9
- **Bitrate**: 1-10 Mbps

## Export Settings

- **Format**: MP4, MKV, or WebM
- **Quality**: Low, Medium, High, or Ultra (8K)

## License

MIT
