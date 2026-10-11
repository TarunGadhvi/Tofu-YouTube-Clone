# YouTube Clone

![thumbnail](https://img.youtube.com/vi/ArmPzvHTcfQ/maxresdefault.jpg)

A modern YouTube clone built with Next.js, Drizzle ORM, and modern UI libraries, featuring advanced video processing, real-time transcription, and a responsive design.

## Key Features

- 🎥 Advanced video player with quality controls
- 🎬 Real-time video processing with Mux
- 📝 Automatic video transcription
- 🖼️ Smart thumbnail generation
- 🤖 AI-powered title and description generation
- 📊 Creator Studio with metrics
- 🗂️ Custom playlist management
- 📱 Responsive design across devices
- 🔄 Multiple content feeds
- 💬 Interactive comment system
- 👍 Like and subscription system
- 🎯 Watch history tracking
- 🔐 Authentication system
- 📦 Module-based architecture
- 🗄️ PostgreSQL with DrizzleORM
- 🚀 Next.js 15 & React 19
- 🔄 tRPC for type-safe APIs
- 💅 TailwindCSS & ShadcnUI styling

## Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL or NeonDB account
- Mux account for video processing
- OpenAI API key for AI features
- Upstash account for Redis and Workflows
- Clerk account for authentication

## Getting Started

### Installation

#### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

#### Using npm

```bash
# Install dependencies
npm install
# If you get errors try
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env
```

### Environment Variables

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL=your_postgres_url

# Global
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mux (Video Processing)
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret

# OpenAI (AI Features)
OPENAI_API_KEY=your_openai_api_key

# Upstash (Redis & Workflows)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
UPSTASH_WORKFLOW_URL=your_upstash_workflow_url
QSTASH_TOKEN=your_qstash_token

# Clerk (Authentication)
CLERK_SIGNING_SECRET=your_clerk_signing_secret
```

### Database Setup

```bash
# Using Bun
bun run src/scripts/seed-categories.ts
# Using TSX
tsx src/scripts/seed-categories.ts
```

### Development

```bash
# Using Bun
bun run dev:all

# Using npm
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint
- `dev:all` - Start dev server and webhook tunnel (for local Stripe/webhooks)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [UploadThing](https://uploadthing.com/)
- [Mux Video](https://mux.com/)
- [Clerk Auth](https://clerk.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Upstash](https://upstash.com/)
