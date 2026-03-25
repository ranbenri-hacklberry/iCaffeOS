# LITE Version Architecture - Complete Plan

## 🎯 Overview

Create a lightweight version of icaffeOS for budget Android tablets (2GB RAM) that includes only:
- **MenuOrdering** (POS - קדש)
- **KDS** (Kitchen Display System - מטבח)
- **OrderStatus** (Order Tracking - עדכון הזמנות)

**Target:** 80% smaller bundle, 3x better battery life, smooth 60 FPS on cheap tablets.

---

## 1️⃣ Unified State Management (Zustand everywhere)

### Problem Fixed
- ❌ OLD: FULL used Context API, LITE used Zustand → Code drifting
- ✅ NEW: Both use Zustand → Shared hooks, no duplication

### Implementation

**File: `/src/stores/useAppStore.ts`**

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface User {
  id: string;
  business_id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
}

export interface Order {
  id: string;
  business_id: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // ===== AUTH =====
    user: null as User | null,
    setUser: (user: User | null) => set({ user }),
    
    // ===== ORDERS =====
    orders: [] as Order[],
    setOrders: (orders: Order[]) => set({ orders }),
    addOrder: (order: Order) => set((state) => ({
      orders: [order, ...state.orders],
    })),
    updateOrder: (id: string, updates: Partial<Order>) => set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...updates } : o),
    })),
    
    // ===== CONNECTION =====
    isOnline: true,
    setIsOnline: (online: boolean) => set({ isOnline: online }),
    
    // ===== THEME =====
    theme: 'light' as 'light' | 'dark',
    setTheme: (theme: 'light' | 'dark') => set({ theme }),
    
    // ===== SYNC CONTROL =====
    syncMode: 'active' as 'active' | 'background' | 'disabled',
    setSyncMode: (mode: 'active' | 'background' | 'disabled') => set({ syncMode: mode }),
    
    // ===== SYNC METADATA =====
    lastSyncTime: null as Date | null,
    setLastSyncTime: (time: Date | null) => set({ lastSyncTime: time }),
    
    // ===== HELPERS =====
    reset: () => set({
      user: null,
      orders: [],
      isOnline: true,
      theme: 'light',
      syncMode: 'active',
      lastSyncTime: null,
    }),
  }))
);

// Selectors for performance
export const selectUser = (state: ReturnType<typeof useAppStore.getState>) => state.user;
export const selectOrders = (state: ReturnType<typeof useAppStore.getState>) => state.orders;
export const selectIsOnline = (state: ReturnType<typeof useAppStore.getState>) => state.isOnline;
```

### Usage in Components

```typescript
// In MenuOrdering.tsx
import { useAppStore } from '@/stores/useAppStore';

export function MenuOrdering() {
  const orders = useAppStore((state) => state.orders);
  const addOrder = useAppStore((state) => state.addOrder);
  
  return (
    <div>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### Benefits
- ✅ No Context API re-renders
- ✅ Shared across LITE and FULL
- ✅ Memory efficient
- ✅ Selector-based subscriptions (only re-render when needed)

---

## 2️⃣ Image Proxy Service (Thumbnails)

### Problem Fixed
- ❌ OLD: Full-resolution images crash 2GB tablets
- ✅ NEW: Proxy service resizes to WebP thumbnails on backend

### Implementation

**File: `/src/services/imageProxyService.ts`**

```typescript
export interface ImageOptions {
  url: string;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg';
  quality?: number;
}

/**
 * Get optimized image URL for LITE/FULL modes
 * LITE: Always 300x300 WebP @ 75% quality
 * FULL: Can request larger sizes
 */
export function getOptimizedImageUrl(
  options: ImageOptions,
  mode: 'lite' | 'full' = 'lite'
): string {
  const {
    url,
    width = mode === 'lite' ? 300 : 800,
    height = mode === 'lite' ? 300 : 600,
    format = 'webp',
    quality = mode === 'lite' ? 75 : 90,
  } = options;

  const params = new URLSearchParams({
    url: encodeURIComponent(url),
    w: width.toString(),
    h: height.toString(),
    f: format,
    q: quality.toString(),
  });

  return `/api/image-proxy?${params.toString()}`;
}

/**
 * Preload image for better UX
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}
```

**Backend: `/backend/routes/imageProxy.ts`**

```typescript
import express from 'express';
import sharp from 'sharp';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24h cache

router.get('/api/image-proxy', async (req, res) => {
  try {
    const { url, w, h, f, q } = req.query;

    // Validate inputs
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid url' });
    }

    const width = Math.min(parseInt(w as string) || 300, 1200);
    const height = Math.min(parseInt(h as string) || 300, 1200);
    const format = (f as string) || 'webp';
    const quality = Math.min(parseInt(q as string) || 75, 100);

    // Check cache
    const cacheKey = `${url}:${width}:${height}:${format}:${quality}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', `image/${format}`);
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('X-Cache', 'HIT');
      return res.send(cached);
    }

    // Fetch original image
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const buffer = await response.buffer();

    // Resize and convert
    const resized = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(format, { quality })
      .toBuffer();

    // Cache result
    cache.set(cacheKey, resized);

    res.set('Content-Type', `image/${format}`);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Cache', 'MISS');
    res.send(resized);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default router;
```

### Usage in Components

```typescript
// In ProductCard.tsx
import { getOptimizedImageUrl } from '@/services/imageProxyService';

export function ProductCard({ product, mode = 'lite' }) {
  const imageUrl = getOptimizedImageUrl(
    { url: product.image_url },
    mode
  );

  return (
    <div className="product-card">
      <img src={imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

### Benefits
- ✅ 90% smaller images (300x300 WebP vs full resolution)
- ✅ 24h server-side cache
- ✅ Reduces memory pressure on tablets
- ✅ Faster network transfer

---

## 3️⃣ Single package.json + Build Modes

### Problem Fixed
- ❌ OLD: Two separate package.json files → Dependency hell
- ✅ NEW: Single package.json with two build targets

### Implementation

**File: `package.json`**

```json
{
  "name": "self-service-kiosk",
  "version": "5.0.2",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:lite": "vite --config vite.lite.config.ts",
    "build": "vite build",
    "build:lite": "vite build --config vite.lite.config.ts",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.0.2",
    "zustand": "^5.0.10",
    "dexie": "^4.0.0",
    "@supabase/supabase-js": "^2.89.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.484.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0"
  }
}
```

**File: `vite.config.ts` (FULL)**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.VITE_MODE': JSON.stringify('full'),
  },
  server: {
    port: 4028,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'src/main.tsx',
    },
  },
});
```

**File: `vite.lite.config.ts` (LITE)**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.VITE_MODE': JSON.stringify('lite'),
  },
  server: {
    port: 2102,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist-lite',
    rollupOptions: {
      input: 'src/main.lite.tsx',
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'zustand'],
          'ui': ['lucide-react'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

### Benefits
- ✅ Single source of truth for dependencies
- ✅ No version mismatches
- ✅ Easy to update packages
- ✅ Two separate builds (FULL: 4028, LITE: 2102)

---

## 4️⃣ CSS Transitions (No Framer Motion)

### Problem Fixed
- ❌ OLD: Framer Motion = 80KB + CPU overhead
- ✅ NEW: GPU-accelerated CSS transitions

### Implementation

**File: `/src/components/LiteButton.tsx`**

```typescript
import './LiteButton.css';

interface LiteButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function LiteButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: LiteButtonProps) {
  return (
    <button
      className={`lite-btn lite-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

**File: `/src/components/LiteButton.css`**

```css
.lite-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  
  /* GPU acceleration */
  transform: translateZ(0);
  will-change: transform, background-color;
  
  /* Smooth transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.lite-btn--primary {
  background: #007AFF;
  color: white;
}

.lite-btn--primary:active {
  transform: scale(0.95) translateZ(0);
  background: #0051D5;
}

.lite-btn--primary:hover {
  background: #0051D5;
}

.lite-btn--secondary {
  background: #E5E5EA;
  color: #000;
}

.lite-btn--secondary:active {
  transform: scale(0.95) translateZ(0);
  background: #D1D1D6;
}

.lite-btn--danger {
  background: #FF3B30;
  color: white;
}

.lite-btn--danger:active {
  transform: scale(0.95) translateZ(0);
  background: #CC2E24;
}

.lite-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**File: `/src/components/LiteCard.tsx`**

```typescript
import './LiteCard.css';

interface LiteCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function LiteCard({ children, onClick, className }: LiteCardProps) {
  return (
    <div
      className={`lite-card ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
```

**File: `/src/components/LiteCard.css`**

```css
.lite-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* GPU acceleration */
  transform: translateZ(0);
  will-change: transform, box-shadow;
  
  /* Smooth transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.lite-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px) translateZ(0);
}

.lite-card:active {
  transform: translateY(0) translateZ(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Benefits
- ✅ GPU-accelerated (60 FPS)
- ✅ No JavaScript overhead
- ✅ Minimal CSS (< 5KB)
- ✅ Feels modern and responsive

---

## 5️⃣ Smart Sync (24h only for LITE)

### Problem Fixed
- ❌ OLD: LITE syncs all historical data → CPU jank
- ✅ NEW: LITE syncs only last 24h, FULL syncs everything

### Implementation

**File: `/src/services/syncService.ts`**

```typescript
import { useAppStore } from '@/stores/useAppStore';
import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';

export type SyncMode = 'lite' | 'full';

/**
 * Initialize sync based on mode
 * LITE: Only 24h of data
 * FULL: All historical data
 */
export async function initializeSync(mode: SyncMode) {
  const store = useAppStore.getState();
  
  try {
    if (mode === 'lite') {
      await syncLiteMode();
    } else {
      await syncFullMode();
    }
    
    store.setLastSyncTime(new Date());
  } catch (error) {
    console.error('Sync error:', error);
    store.setIsOnline(false);
  }
}

/**
 * LITE: Sync only last 24 hours
 */
async function syncLiteMode() {
  const store = useAppStore.getState();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch recent orders from Supabase
  const { data: recentOrders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', store.user?.business_id)
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Store in Dexie (local)
  await db.orders.bulkPut(recentOrders || []);
  store.setOrders(recentOrders || []);

  // Subscribe to real-time updates (only recent)
  supabase
    .from('orders')
    .on('*', (payload) => {
      const orderDate = new Date(payload.new.created_at);
      if (orderDate > oneDayAgo) {
        store.addOrder(payload.new);
        db.orders.put(payload.new);
      }
    })
    .subscribe();
}

/**
 * FULL: Sync all historical data
 */
async function syncFullMode() {
  const store = useAppStore.getState();

  // Fetch all orders
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', store.user?.business_id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Store in Dexie
  await db.orders.bulkPut(allOrders || []);
  store.setOrders(allOrders || []);

  // Subscribe to all real-time updates
  supabase
    .from('orders')
    .on('*', (payload) => {
      store.addOrder(payload.new);
      db.orders.put(payload.new);
    })
    .subscribe();
}

/**
 * Pause sync during heavy operations
 */
export function pauseSync() {
  const store = useAppStore.getState();
  store.setSyncMode('background');
}

/**
 * Resume sync
 */
export function resumeSync() {
  const store = useAppStore.getState();
  store.setSyncMode('active');
}
```

### Benefits
- ✅ LITE: 90% less data to sync
- ✅ No CPU jank during operations
- ✅ Faster initial load
- ✅ FULL still has full history

---

## 📁 Folder Structure

```
/self_service_kiosk
├─ src/
│  ├─ apps/
│  │  ├─ FullApp.tsx          (15 pages)
│  │  └─ LiteApp.tsx           (3 pages)
│  │
│  ├─ pages/
│  │  ├─ MenuOrdering.tsx      ✅ (shared)
│  │  ├─ KDS.tsx               ✅ (shared)
│  │  ├─ OrderStatus.tsx       ✅ (shared)
│  │  ├─ Onboarding.tsx        ❌ (FULL only)
│  │  ├─ AdminDash.tsx         ❌ (FULL only)
│  │  └─ ... (12 more)
│  │
│  ├─ stores/
│  │  └─ useAppStore.ts        ✅ (shared, Zustand)
│  │
│  ├─ services/
│  │  ├─ imageProxyService.ts  ✅ (shared)
│  │  ├─ syncService.ts        ✅ (shared, mode-aware)
│  │  └─ ... (others)
│  │
│  ├─ components/
│  │  ├─ LiteButton.tsx        ✅ (CSS transitions)
│  │  ├─ LiteCard.tsx          ✅ (CSS transitions)
│  │  └─ ... (shared)
│  │
│  ├─ main.tsx                 (FULL entry)
│  └─ main.lite.tsx            (LITE entry)
│
├─ vite.config.ts              (FULL)
├─ vite.lite.config.ts         (LITE)
├─ package.json                (single, both modes)
└─ backend/
   ├─ routes/
   │  ├─ imageProxy.ts         (resize/convert images)
   │  └─ ... (shared)
```

---

## 📊 Expected Results

| Metric | FULL | LITE | Improvement |
|--------|------|------|-------------|
| **Bundle Size** | 580 KB | 140 KB | **76% ↓** |
| **Memory (idle)** | 380 MB | 85 MB | **77% ↓** |
| **Memory (active)** | 520 MB | 110 MB | **78% ↓** |
| **FPS** | 25-30 | 55-60 | **2x** |
| **TTI** | 8-12s | 1-2s | **6x** |
| **Battery (5h)** | Dead | 50%+ | **3x** |
| **CPU Temp** | 45-55°C | 22-28°C | **-50%** |
| **Code Duplication** | N/A | 0% | **Shared** |
| **Sync Overhead** | Full | 24h only | **Optimized** |

---

## ✅ Implementation Checklist

- [ ] Create `/src/stores/useAppStore.ts` (Zustand)
- [ ] Create `/src/services/imageProxyService.ts`
- [ ] Create `/backend/routes/imageProxy.ts`
- [ ] Create `vite.lite.config.ts`
- [ ] Create `/src/main.lite.tsx`
- [ ] Create `/src/apps/LiteApp.tsx`
- [ ] Create `/src/components/LiteButton.tsx` + CSS
- [ ] Create `/src/components/LiteCard.tsx` + CSS
- [ ] Create `/src/services/syncService.ts`
- [ ] Update `package.json` with build scripts
- [ ] Test LITE build: `npm run build:lite`
- [ ] Test LITE dev: `npm run dev:lite`
- [ ] Measure bundle size and performance
- [ ] Deploy LITE to separate URL (e.g., lite.icaffe.com)

---

## 🚀 Deployment Strategy

### FULL System
- URL: `https://icaffe.hacklberryfinn.com`
- Port: 4028
- Target: Desktop/Admin
- Bundle: 580 KB

### LITE System
- URL: `https://lite.icaffe.hacklberryfinn.com` (or same domain with `/lite` path)
- Port: 2102
- Target: Budget tablets/POS
- Bundle: 140 KB

### Shared Backend
- URL: `https://api.icaffe.hacklberryfinn.com`
- Port: 8081
- Both systems use same API

---

## 💡 Key Decisions

1. **Zustand everywhere** - No Context API drifting
2. **Image proxy** - WebP thumbnails for tablets
3. **Single package.json** - No dependency hell
4. **CSS transitions** - GPU-accelerated, no Framer
5. **24h sync** - LITE only, FULL has full history
6. **Shared code** - 60% code reuse between LITE and FULL
