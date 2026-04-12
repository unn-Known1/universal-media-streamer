# Contributing to Universal Media Streamer

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/unn-Known1/universal-media-streamer.git
cd universal-media-streamer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or similar port shown in terminal).

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/
├── components/       # React UI components
├── contexts/         # React contexts (PlayerContext, SettingsContext)
├── hooks/           # Custom React hooks
├── utils/           # Helper functions and utilities
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component
└── main.tsx         # React entry point
```

## Testing

### Manual Testing

1. Run `npm run dev` to start the development server
2. Test different streaming sources:
   - HLS streams (.m3u8)
   - DASH streams (.mpd)
   - YouTube videos
   - Direct video URLs

### Test Scenarios

- Playback controls work correctly
- Quality switching functions properly
- Picture-in-Picture mode works
- Fullscreen and theater mode function
- Keyboard shortcuts respond correctly

## Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use functional components with hooks
- Run `npm run lint` before committing

## Ways to Contribute

### 🐛 Report Bugs
- Use GitHub Issues to report problems
- Include steps to reproduce the issue
- Attach screenshots if applicable

### 💡 Suggest Features
- Open a GitHub Issue with the `enhancement` label
- Describe the feature and its use case
- Explain why it would benefit the project

### 📝 Improve Documentation
- Fix typos and unclear explanations
- Add examples for new features
- Translate documentation to other languages

### 🎨 UI/UX Contributions
- Suggest design improvements
- Create new themes
- Improve accessibility

### 🔧 Code Contributions

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. Make your **changes**
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. Open a **Pull Request**

## Good First Issues

Looking for ways to contribute? Try these beginner-friendly tasks:

- [ ] Add support for Twitch streaming
- [ ] Create example for custom subtitle tracks
- [ ] Improve error messages for unsupported formats
- [ ] Add more keyboard shortcuts
- [ ] Improve mobile responsiveness
- [ ] Add additional language support

Check the [Issue Tracker](https://github.com/unn-Known1/universal-media-streamer/issues) for more opportunities!

## Pull Request Guidelines

- Keep PRs focused and reasonably sized
- Include a clear description of changes
- Link related issues
- Ensure all tests pass
- Update documentation if needed

## Questions?

- Open a GitHub Discussion for general questions
- Use Issues for bug reports and feature requests