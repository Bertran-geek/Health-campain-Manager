# Health Campaign Manager - Frontend

A Next.js-based frontend application for managing health campaigns.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at http://localhost:3000

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── ...                # Custom components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── public/                 # Static assets
├── styles/                 # Global styles
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # TailwindCSS configuration
└── tsconfig.json          # TypeScript configuration
```

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`.

Configure the API URL in your environment:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
