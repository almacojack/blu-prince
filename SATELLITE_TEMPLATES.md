# TingOs Satellite Site Templates

This document provides templates for creating domain-specific satellite sites that consume the TingOs API. Each satellite site runs as a separate Replit project but shares the same data layer through API calls.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TingOs Platform                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database (Neon)                   │   │
│  │  • users, cartridges, worlds, vault_entries         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TingOs API Server                       │   │
│  │  • /api/worlds, /api/cartridges, /api/vault         │   │
│  │  • Authentication, tenant filtering                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Unwanted │       │ Artsy   │       │  Coins  │
   │   .ad   │       │  .sale  │       │  .rip   │
   └─────────┘       └─────────┘       └─────────┘
   Misfit Toys       Art Dealer        Crypto Swing
   Auctions          Platform          Visualization
```

---

## Template 1: Unwanted.ad (Misfit Toys Auction)

### Concept
A platform for auctioning "misfit toys" - creative projects that didn't make it, prototypes, experiments, and abandoned ideas. Each listing is a TOSS cartridge containing the project's state machine and assets.

### Repl Setup

1. **Create new Repl** with React + Vite template
2. **Install dependencies:**
   ```bash
   npm install @tanstack/react-query framer-motion lucide-react tailwindcss
   ```

3. **Environment Variables:**
   ```
   TINGOS_API_URL=https://your-tingos-repl.replit.app
   TINGOS_TENANT=unwanted
   ```

### Key Files

**`src/lib/api.ts`**
```typescript
const API_URL = import.meta.env.VITE_TINGOS_API_URL || 'https://tingos.replit.app';
const TENANT = 'unwanted';

export async function fetchAuctionListings() {
  const res = await fetch(`${API_URL}/api/worlds?tenant=${TENANT}`, {
    headers: { 'x-tenant': TENANT }
  });
  return res.json();
}

export async function getListingDetails(slug: string) {
  const res = await fetch(`${API_URL}/api/worlds/${slug}`, {
    headers: { 'x-tenant': TENANT }
  });
  return res.json();
}

export async function placeBid(worldId: string, amount: number, userId: string) {
  // Bid logic - could be stored in TingOs or separate auction service
  const res = await fetch(`${API_URL}/api/bids`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-tenant': TENANT 
    },
    body: JSON.stringify({ worldId, amount, userId })
  });
  return res.json();
}
```

**`src/pages/Home.tsx`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchAuctionListings } from '../lib/api';

export default function AuctionHome() {
  const { data: listings } = useQuery({
    queryKey: ['auctions'],
    queryFn: fetchAuctionListings
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-orange-500/30 p-6">
        <h1 className="text-4xl font-bold text-orange-400">
          UNWANTED.ad
        </h1>
        <p className="text-zinc-400">
          Home for misfit toys and abandoned dreams
        </p>
      </header>
      
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map(listing => (
            <AuctionCard key={listing.id} listing={listing} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

### Theme & Branding
- **Colors:** Orange (#f97316), Black, Dark grays
- **Vibe:** Industrial, salvage yard, "island of misfit toys"
- **Typography:** Monospace for prices, bold sans-serif headers

---

## Template 2: artsy.sale (Art Dealer Platform)

### Concept
An upscale platform for art dealers to showcase and auction curated collections. Each World represents a gallery exhibition, and cartridges are individual pieces with provenance, pricing, and interactive 3D previews.

### Repl Setup

1. **Create new Repl** with React + Vite template
2. **Install dependencies:**
   ```bash
   npm install @tanstack/react-query @react-three/fiber @react-three/drei framer-motion
   ```

3. **Environment Variables:**
   ```
   TINGOS_API_URL=https://your-tingos-repl.replit.app
   TINGOS_TENANT=artsy
   ```

### Key Files

**`src/lib/api.ts`**
```typescript
const API_URL = import.meta.env.VITE_TINGOS_API_URL || 'https://tingos.replit.app';
const TENANT = 'artsy';

export async function fetchGalleries() {
  const res = await fetch(`${API_URL}/api/worlds?tenant=${TENANT}&visibility=public`, {
    headers: { 'x-tenant': TENANT }
  });
  return res.json();
}

export async function getGalleryPieces(worldId: string) {
  const res = await fetch(`${API_URL}/api/worlds/${worldId}/cartridges`, {
    headers: { 'x-tenant': TENANT }
  });
  return res.json();
}

export async function inquireAboutPiece(cartridgeId: string, email: string, message: string) {
  const res = await fetch(`${API_URL}/api/inquiries`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-tenant': TENANT 
    },
    body: JSON.stringify({ cartridgeId, email, message })
  });
  return res.json();
}
```

**`src/pages/Gallery.tsx`**
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';

export default function GalleryView({ slug }: { slug: string }) {
  const { data: pieces } = useQuery({
    queryKey: ['gallery', slug],
    queryFn: () => getGalleryPieces(slug)
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 p-8">
        <h1 className="text-5xl font-serif text-gray-900">
          artsy.sale
        </h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="h-[600px]">
          <Canvas>
            <Environment preset="studio" />
            <OrbitControls />
            {/* 3D piece preview */}
          </Canvas>
        </div>
        
        <div className="p-8">
          <h2 className="text-3xl font-serif mb-4">Exhibition Details</h2>
          {/* Piece listing with prices */}
        </div>
      </div>
    </div>
  );
}
```

### Theme & Branding
- **Colors:** White, Black, Gold accents (#d4af37)
- **Vibe:** Minimalist, gallery-like, sophisticated
- **Typography:** Serif for headings, clean sans-serif for body

---

## Template 3: coins.rip (Crypto Swing Visualization)

### Concept
A visualization platform for crypto swing trading strategies. Each World represents a trading strategy, and cartridges contain state machines modeling entry/exit conditions, stop losses, and position sizing.

### Repl Setup

Similar pattern to above, with `TINGOS_TENANT=coins`

### Theme & Branding
- **Colors:** Neon green (#22c55e), Black, Chart colors
- **Vibe:** Terminal-like, data-heavy, realtime
- **Typography:** Monospace throughout

---

## Shared Authentication Flow

All satellite sites use OAuth redirect to TingOs for authentication:

```typescript
// In satellite site
function LoginButton() {
  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${TINGOS_API_URL}/api/login?return_to=${returnUrl}&tenant=${TENANT}`;
  };
  
  return <button onClick={handleLogin}>Sign In</button>;
}
```

TingOs handles authentication and redirects back with a session cookie valid across subdomains.

---

## Tenant-Specific API Filtering

When creating worlds in TingOs, set the `tenant` field to filter content:

```typescript
// Creating a world for Unwanted.ad
const world = await storage.createWorld({
  title: "My Misfit Project",
  slug: "misfit-001",
  owner_id: userId,
  tenant: "unwanted",  // <-- Tenant tag
  visibility: "public"
});
```

The API automatically filters:
- `/api/worlds?tenant=unwanted` returns only Unwanted.ad worlds
- `/api/worlds?tenant=artsy` returns only artsy.sale worlds

---

## Deployment Checklist

For each satellite Repl:

1. [ ] Clone template or create from scratch
2. [ ] Set environment variables (API URL, tenant)
3. [ ] Customize theme/branding
4. [ ] Test API connectivity
5. [ ] Configure custom domain in Replit Deployments
6. [ ] Set up SSL (automatic with Replit)
7. [ ] Add to TingOs tenant registry

---

## Next Steps

1. **Implement in TingOs:** Add tenant filtering to API routes
2. **Create first satellite:** Start with Unwanted.ad as proof of concept
3. **Shared component library:** Consider publishing common UI components as npm package
4. **Monitoring:** Set up logging/analytics per tenant
