# vLLM Web UI

A minimalist terminal-style web interface for vLLM with a 90's hacker aesthetic.

## Features

- **Chat Interface**: Conversational chat with streaming responses
- **Model Selection**: Choose from available vLLM models
- **Real-time Statistics**: Tokens per second, latency, and usage metrics
- **Web Search**: Integrated SearXNG search (use `search: <query>` in chat)
- **OCR Processing**: Upload 100+ images and extract data to Excel using DeepSeek-OCR

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React 19

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create `.env.local`):
```env
VLLM_API_URL=http://localhost:8000/v1
SEARX_API_URL=https://searx.derrumbar.top
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Chat Mode
- Select a model from the dropdown
- Type messages and press Enter to send
- Use `search: <query>` to perform web searches
- View real-time statistics in the stats panel

### OCR Mode
- Switch to the OCR tab
- Upload images (drag & drop or click to select)
- Click "PROCESS OCR" to extract data
- Preview and export results to Excel

## Requirements

- vLLM server running on `localhost:8000` (or configure via env)
- Node.js 18+ and npm

## License

MIT
