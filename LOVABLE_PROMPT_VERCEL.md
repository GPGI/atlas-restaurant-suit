# Prompt for Lovable: ATLAS HOUSE Restaurant System (Vercel Ready)

Build a restaurant management system with three pages: customer menu, premium customer interface, and staff dashboard. Use **Next.js 14+ (App Router)** with React + TypeScript, Tailwind CSS, and design it for seamless Vercel deployment.

## Project Setup Requirements

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API or Zustand
- **Deployment:** Optimized for Vercel with proper configuration files

## Vercel Configuration

Create a `vercel.json` file with:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/menu",
      "destination": "/menu"
    },
    {
      "source": "/admin",
      "destination": "/admin"
    }
  ]
}
```

Create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

## Page Structure (App Router)

### Page 1: Customer Menu (`/menu?table=Table_01`)

**File:** `app/menu/page.tsx`

**Features:**
- Display menu items grouped by category (Soups 🥣, Salads 🥗, Main Dishes 🍛)
- Each item shows: name, price, +/- quantity buttons
- Shopping cart with running total in Bulgarian Lev (лв)
- Three action buttons:
  - "🍽️ Изпрати поръчка" - Submit order (store in context/state)
  - "🔔 Повикай сервитьор" - Create waiter call request
  - "💳 Сметка" - Open payment modal (Cash/Card options)
- Table indicator from URL searchParams
- Session management: track current session in localStorage
- Lock interface after bill request

**Menu Data:**
```typescript
const menuItems = [
  { cat: "🥣 Супи", name: "Пилешка супа", price: 3.50 },
  { cat: "🥣 Супи", name: "Супа топчета", price: 3.80 },
  { cat: "🥗 Салати", name: "Шопска салата", price: 5.50 },
  { cat: "🥗 Салати", name: "Зелена салата", price: 4.80 },
  { cat: "🍛 Основни", name: "Свинско с ориз", price: 6.90 },
  { cat: "🍛 Основни", name: "Мусака", price: 5.50 },
  { cat: "🍛 Основни", name: "Пилешко филе с картофи", price: 7.50 }
];
```

**Implementation:**
- Use `useSearchParams()` from Next.js for table parameter
- Client component with 'use client' directive
- Store cart in React Context or Zustand
- Use localStorage for session persistence
- Mock API calls with setTimeout for async behavior

**Design:** Dark background (bg-zinc-950), white text, amber buttons (#f59e0b), max-w-md container, rounded-xl cards, mobile-responsive.

### Page 2: Premium Customer Interface (`/?table=Table_01&vip=true`)

**File:** `app/page.tsx`

**Features:**
- Dynamic menu loaded from mock data or API route
- Glassmorphism card design for menu items
- Gold gradient buttons (#d4af37)
- Fixed bottom checkout bar (appears when cart has items)
- Quick action buttons: "Staff" and "Bill"
- VIP member indicator badge (if `vip` URL param exists)
- Payment modal with Card/Cash options
- Haptic feedback on button interactions (if supported)
- Smooth fade-in animations

**Menu Structure:**
```typescript
const menuItems = {
  "item1": { name: "Signature Dish", desc: "Premium description", price: 12.50 },
  "item2": { name: "Chef's Special", desc: "Exquisite flavors", price: 15.00 }
  // ... more items
};
```

**Implementation:**
- Create API route: `app/api/menu/route.ts` for menu data
- Use `useSearchParams()` for table and vip parameters
- Client component with state management
- Store cart in Context/Zustand

**Design:** Playfair Display font for headings, gold gradients, glass effects with backdrop blur, premium spacing, hidden scrollbars, elegant animations.

### Page 3: Staff Dashboard (`/admin`)

**File:** `app/admin/page.tsx`

**Features:**
- Grid layout displaying 10 tables (Table_01 to Table_10)
- Real-time-like monitoring using API routes with polling
- Status color indicators:
  - **Green (FREE)** - No requests/activity
  - **Red pulsing (ALERT)** - Has pending requests
  - **Gold (OCCUPIED)** - Has active orders/completed requests
- Each table card displays:
  - Table name and status badge
  - Chronological list of requests (sorted by timestamp)
  - Pending requests highlighted with "OK" button to mark completed
  - Completed requests shown with checkmark
  - Running bill total calculated from all requests
  - "Reset Station" button (appears when bill is paid)
- Alert sound notification when new pending request appears
- Click "OK" to mark request as completed
- Reset button clears all table data

**API Routes Needed:**
- `app/api/requests/route.ts` - GET all requests, POST new request
- `app/api/requests/[tableId]/route.ts` - GET table requests, PATCH update status, DELETE reset

**Data Structure:**
```typescript
interface TableRequest {
  id: string;
  action: string;
  details: string;
  total: string;
  status: "pending" | "completed";
  timestamp: number;
}
```

**Implementation:**
- Use `useEffect` with setInterval for polling (or WebSocket if needed)
- Client component with real-time state updates
- API routes for CRUD operations
- Store in memory or use a simple JSON file (or database later)

**Design:** Dark theme (#050505), gold accents (#d4af37), card-based layout with colored borders, pulsing animations for alerts, custom scrollbars, professional terminal aesthetic.

## API Routes Structure

### `app/api/menu/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const menu = {
    // menu items data
  };
  return NextResponse.json(menu);
}
```

### `app/api/requests/route.ts`
```typescript
import { NextResponse } from 'next/server';

// GET all requests
export async function GET() {
  // Return all table requests
}

// POST new request
export async function POST(request: Request) {
  // Create new request
}
```

### `app/api/requests/[tableId]/route.ts`
```typescript
import { NextResponse } from 'next/server';

// GET table requests
export async function GET(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  // Return requests for specific table
}

// PATCH update request status
export async function PATCH(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  // Update request status
}

// DELETE reset table
export async function DELETE(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  // Clear all table requests
}
```

## Design System

**Color Palette:**
- Background: `#050505` (zinc-950)
- Primary Gold: `#d4af37` (amber-500)
- Success Green: `#10b981`
- Alert Red: `#ef4444`
- Text Primary: White
- Text Secondary: `#a1a1aa` (zinc-400)

**Typography:**
- Headings: Bold, uppercase, wide letter-spacing
- Body: Inter font family (from Google Fonts)
- Premium Headings: Playfair Display (serif from Google Fonts)

**Components Needed:**
1. `MenuItemCard` - Menu item with quantity controls
2. `CartSummary` - Total and item count display
3. `PaymentModal` - Cash/Card selection modal
4. `TableCard` - Staff dashboard table display
5. `RequestRow` - Individual request in table card
6. `StatusBadge` - Color-coded status indicator

## Technical Requirements

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS with custom configuration
- **State Management:** React Context API or Zustand
- **Fonts:** Google Fonts (Inter, Playfair Display) via `next/font`
- **Routing:** Next.js App Router with proper metadata
- **Data:** API routes for data fetching, localStorage for client state
- **Real-time:** Polling with setInterval or Server-Sent Events
- **Animations:** CSS transitions and Tailwind animations
- **Responsive:** Mobile-first, tablet and desktop support
- **Accessibility:** ARIA labels, keyboard navigation, semantic HTML
- **Error Handling:** Error boundaries, loading states
- **Notifications:** Toast notifications (use shadcn/ui or similar)

## Vercel Deployment Checklist

1. **Package.json scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

2. **Environment Variables:** Create `.env.local` template (no sensitive data in repo)

3. **Build Optimization:**
   - Use Next.js Image component for any images
   - Enable static generation where possible
   - Use dynamic imports for heavy components

4. **Metadata:** Add proper metadata to each page:
```typescript
export const metadata = {
  title: 'ATLAS HOUSE - Customer Menu',
  description: 'Restaurant ordering system'
}
```

5. **Error Pages:** Create `app/error.tsx` and `app/not-found.tsx`

6. **Loading States:** Create `app/loading.tsx` for loading UI

## File Structure

```
app/
  ├── layout.tsx          # Root layout with fonts and providers
  ├── page.tsx            # Premium customer interface
  ├── menu/
  │   └── page.tsx        # Customer menu page
  ├── admin/
  │   └── page.tsx        # Staff dashboard
  ├── api/
  │   ├── menu/
  │   │   └── route.ts
  │   └── requests/
  │       ├── route.ts
  │       └── [tableId]/
  │           └── route.ts
  ├── error.tsx
  ├── not-found.tsx
  └── loading.tsx
components/
  ├── MenuItemCard.tsx
  ├── CartSummary.tsx
  ├── PaymentModal.tsx
  ├── TableCard.tsx
  ├── RequestRow.tsx
  └── StatusBadge.tsx
context/
  └── RestaurantContext.tsx  # Or use Zustand store
lib/
  └── utils.ts
public/
  └── (static assets)
```

## Key Functionalities

**Customer Flow:**
1. Load menu → Display categorized items
2. Add to cart → Update quantity state
3. Submit order → POST to API, show confirmation
4. Call waiter → Create request via API
5. Request bill → Open modal, select payment method
6. Lock interface → Disable interactions after bill request

**Staff Flow:**
1. Monitor tables → Poll API for all tables
2. View requests → Display pending and completed
3. Resolve request → PATCH API to mark completed
4. View totals → Calculate running bill from requests
5. Reset table → DELETE API to clear table data

## Additional Features

- URL parameter parsing using Next.js `useSearchParams()`
- Session persistence using localStorage (client-side only)
- Mobile-optimized touch interactions
- Smooth page transitions with Next.js navigation
- Loading skeletons using Suspense
- Empty states for no data
- Confirmation dialogs for critical actions
- SEO optimization with proper metadata
- PWA ready (optional: add manifest.json)

## Deployment Instructions

1. **Build locally:** `npm run build` to test
2. **Push to GitHub:** Ensure all files are committed
3. **Connect to Vercel:** Import GitHub repository
4. **Configure:** Vercel auto-detects Next.js
5. **Deploy:** Automatic deployment on push

**Vercel will automatically:**
- Detect Next.js framework
- Run build command
- Deploy to production
- Provide preview URLs for PRs

Generate a production-ready Next.js application with these three pages, optimized for Vercel deployment. Use App Router, API routes for data management, and maintain the dark premium aesthetic throughout. Ensure all components are properly typed with TypeScript and follow Next.js best practices.
