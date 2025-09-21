# Rising BSM V2

> Business Service Management Platform - Next Generation

A modern, scalable Business Service Management platform built with Next.js 15, Supabase, and TypeScript. Rising BSM V2 provides comprehensive service management capabilities with enterprise-grade security and performance.

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a>
</p>

## 🚀 Features

- **Modern Tech Stack**: Next.js 15 with App Router, React 19, TypeScript
- **Authentication**: Cookie-based auth with Supabase SSR support
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **CI/CD**: Automated testing, building, and deployment with GitHub Actions
- **Containerization**: Docker support for consistent deployments
- **Type Safety**: Full TypeScript integration with strict configuration

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database & Auth**: Supabase with SSR support
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript with strict configuration
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker + GitHub Actions
- **Theme**: next-themes with system preference detection

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/rising-bsm-v2.git
   cd rising-bsm-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 🏗 Architecture

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── protected/         # Protected routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase configuration
│   └── utils.ts          # Shared utilities
├── .github/workflows/    # CI/CD workflows
└── ...
```

### Authentication Flow

- **Client-side**: Browser client for React components
- **Server-side**: Server client with cookie-based sessions
- **Middleware**: Session management and refresh
- **Route Protection**: Server-side authentication checks

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API route and database interaction tests
- **Coverage Reporting**: Automatic coverage reports with 70% threshold
- **CI Integration**: Tests run automatically on push/PR

Run tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## 🚢 Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t rising-bsm-v2 .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your-url \
     -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-key \
     rising-bsm-v2
   ```

### CI/CD Pipeline

The project includes automated GitHub Actions workflows:

- **CI Pipeline**: Lint, type-check, test, and build on every push/PR
- **Deployment Pipeline**: Automated deployment to production on main branch
- **Container Registry**: Automatic Docker image building and publishing

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Frising-bsm-v2)

## 🔧 Configuration

### Environment Variables

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key

# Optional: Vercel Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

### Development Configuration

- **TypeScript**: Strict configuration with path aliases (`@/*`)
- **ESLint**: Next.js and TypeScript rules
- **Tailwind**: Extended with shadcn/ui variables
- **Jest**: Configured for Next.js with jsdom environment

## 📋 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow Next.js 15 and React 19 best practices
- Use shadcn/ui components for consistent UI
- Implement proper error handling and loading states

### Authentication Patterns

```typescript
// Server Components
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  // ... component logic
}

// Client Components
import { createClient } from "@/lib/supabase/client";

export function ClientComponent() {
  const supabase = createClient();
  // ... component logic
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-username/rising-bsm-v2/issues)
- **Discussions**: Join the community in [GitHub Discussions](https://github.com/your-username/rising-bsm-v2/discussions)

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

Built with ❤️ by the Rising BSM Team

## 🧩 docker-compose Stack (App + n8n + Postgres)

This repository includes a `docker-compose.yml` to run the app alongside n8n and its Postgres database.

1) Prepare environment

- Copy `.env.example` to `.env.local` and fill Supabase variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Generate docker secrets and n8n credential overwrite:

```
npm run setup
```

This writes `.env` (docker) and `n8n/credentials_overwrite.json` (preloading `supabase_connection` credentials in n8n).

2) Start the stack

```
docker compose up -d --build
```

App: http://localhost:3000 | n8n: http://localhost:5678

3) Verify health

- Open `http://localhost:3000/status` for a connectivity report.

4) First admin / customer portal

- First authenticated user is auto-promoted to `admin` and lands in `/dashboard`.
- Later users are `customer` and use `/portal` to create and track requests.
