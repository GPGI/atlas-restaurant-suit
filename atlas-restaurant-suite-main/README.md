# Atlas Restaurant Suite

Restaurant management and ordering system built with modern web technologies.

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd atlas-restaurant-suite-main

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server with auto-reloading
npm run dev
```

The development server will start on `http://localhost:8080` by default. To access from other devices on your network, use your local IP address (e.g., `http://192.168.110.136:8080`).

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for real-time data synchronization)

## Supabase Integration

This application supports Supabase for real-time data synchronization and persistent storage. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Create a `.env` file with your Supabase credentials (see `.env.example`)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase project
3. The app will automatically use Supabase if configured, or fall back to localStorage

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
