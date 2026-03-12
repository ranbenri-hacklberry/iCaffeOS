# icaffeos ☕

A comprehensive, offline-first Point of Sale (POS) and self-service kiosk application designed for modern cafes and restaurants. Built with high performance and reliability in mind, handling everything from customer orders to kitchen management and inventory control.

![icaffeos](public/og-image.png)

---

## 🚀 Key Features

### 🖥️ Terminals & Interfaces

* **icaffeos:** A beautiful, customer-facing interface for browsing menus, customizing items, and paying independently.
* **POS (Point of Sale):** A fast cashier interface for staff to take orders, handle cash/card payments, and manage tables.
* **KDS (Kitchen Display System):** Real-time order routing to kitchen stations (Bar, Kitchen, Pass) with course timing management.

#### 🔄 KDS Order Status Lifecycle (CRITICAL STATE MACHINE)

To ensure system stability and uniform behavior, the KDS strict status workflow is defined as follows:

1. **New Order (`in_progress` / `new`)**
   * **Entry:** A new order arrives from the POS. It generally enters directly as `in_progress` (or `new`).
   * **Action:** Clicking the primary button (`התחל הכנה` for `new` or `מוכן להגשה` for `in_progress`).
   * **Transition:** Moves the order to the `ready` state.

2. **Ready to Serve (`ready`)**
   * **State:** Order is fully prepared and waiting to be picked up.
   * **Automated Action:** Upon transitioning to `ready`, an automated SMS is sent to the customer (if a phone number exists).
   * **KDS View:** Order moves to the bottom/secondary area labeled "מוכן למסירה" (Completed Orders list).
   * **Action:** Clicking the primary button (`נמסר`).
   * **Transition:** Moves the order to the `completed` state.

3. **Completed (`completed`)**
   * **State:** Order is delivered to the customer.
   * **KDS View:** The order completely visual drops off the active KDS screen and moves exclusively to the History log.

*(Any deviations from this workflow without explicit architectural approval will break the UI's localized reactive layout (`useKDSDataLocal`), which heavily relies on implicit status parsing.)*

* **Admin Dashboard:** Comprehensive back-office for menu editing, employee timesheets, inventory management, and business analytics.

### ⚙️ Core Capabilities

* **Offline-First Architecture:** Built on top of **Dexie.js** (IndexedDB). The system continues to function seamlessly without internet, syncing data to the cloud when connectivity returns.
* **Inventory Tracking:** Real-time stock deduction based on recipes (e.g., a "Cappuccino" order deducts 18g coffee beans and 200ml milk).
* **Loyalty System:** Built-in customer retention program (Buy 10, get 1 free) with phone number lookup.
* **Printer Integration:** Support for thermal receipt printers (Star/Epson) via raw TCP/network commands.
* **Music Player:** Integrated mini-player for controlling venue ambience.

---

## 🛠️ Tech Stack

### Frontend

* **Framework:** [React 18](https://react.dev/)

* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) for animations.
* **State Management:** Redux Toolkit + React Context.
* **Local Database:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper).

### Backend (BaaS)

* **Database:** PostgreSQL (via [Supabase](https://supabase.com/)).

* **Business Logic:** Extensive use of PostgreSQL **RPCs** (Remote Procedure Calls) for critical operations like `submit_order` to simplify frontend logic and ensure ACID transactions.
  * See [SUPABASE_RPC_GUIDE.md](./SUPABASE_RPC_GUIDE.md) for a full list of available functions.
* **Real-time:** Supabase Realtime for instant KDS updates.

---

## 📂 Project Structure

```bash
src/
├── api/                # API service layers
├── assets/             # Images and fonts
├── components/         # Reusable UI components (Buttons, Modals, Cards)
├── context/            # React Contexts (Auth, Theme, Toast)
├── db/                 # Dexie database schema and configuration
├── hooks/              # Custom React hooks (useCart, useLoyalty)
├── layouts/            # Page layouts (Main, Admin, Kiosk)
├── lib/                # Utilities and libraries (Supabase client, formatting)
├── pages/              # Main Route Views
│   ├── dashboard/      # Admin Dashboard view
│   ├── dexie-admin/    # Local DB debugger
│   ├── kds/            # Kitchen Display System
│   ├── menu-ordering/  # The main Ordering Interface
│   ├── mode-selection/ # Terminal mode selector (Home)
│   └── login/          # Auth screens
├── services/           # Background services (Sync, Printers, Queue)
└── store/              # Redux store configuration
```

---

## 🚦 Getting Started

### Prerequisites

* Node.js (v18+)
* npm or yarn

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/your-org/icaffeos.git
    cd icaffeos
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Environment Setup**
    Create a `.env` file based on `.env.example`:

    ```bash
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

4. **Run Development Server**

    ```bash
    npm run dev
    ```

    The app will start on port `4028` (or as configured).

---

## 🔄 Sync & Offline Logic

The application uses a **Queue-Based Sync System**:

1. **Action:** User places an order.
2. **Local Save:** Order is effectively "saved" instantly to Dexie (IndexedDB).
3. **Queue:** A sync task is added to `offlineQueue`.
4. **Background Worker:** The `syncService` monitors the queue and network status.
    * *If Online:* Pushes data to Supabase immediately using RPCs.
    * *If Offline:* Retries later when connection is restored.

---

## 🚀 Hardware Strategy: High-Performance Edge Infrastructure

icaffeOS is designed to run on a tiered architecture, ensuring 100% operational sovereignty and zero latency for AI inference. We’ve deprecated lower-end hardware to focus on high-throughput, deterministic performance.

### Tier 1 — Local Edge · *The "On-Site" Unit*

| Spec | Details |
|---|---|
| **Hardware** | Apple Mac Mini (M4), NVIDIA AGX Orin/Thor |
| **RAM** | 16–32 GB (Unified Memory) |
| **Terminals** | icaffeOS Custom SBC Edge Terminals (<$100) |

### Tier 2 — Office / Studio Hub · *Performance Intelligence*

| Spec | Details |
|---|---|
| **Hardware** | Mac Studio (M2/M3 Ultra) / Mac Mini M4 Pro |
| **RAM** | 32–128 GB |
| **Role** | Multi-tenant management, high-parameter inference |

### Tier 3 — Sovereign Enterprise · *The Beast*

| Spec | Details |
|---|---|
| **Hardware** | NVIDIA AGX Orin / AGX Spark |
| **Role** | Multi-tenant deployments, complex agentic workflows |

### Tier 4 — Future-Proof Edge AI · *Next-Gen*

| Spec | Details |
|---|---|
| **Hardware** | NVIDIA AGX Thor |
| **Role** | Robotics integration, real-time world-model processing |

---

## 📉 The $100 Edge Terminal: Disruption Strategy

While Apple Silicon and Nvidia AGX handle the Heavy Lifting (Inference & DB), the user interaction layer (Terminals) is optimized for extreme cost-efficiency and durability.

### The Problem with Tablets (iPad/Android)

* **High CapEx:** $300-$500 per unit.
* **Fragility:** Not designed for 70°C kitchen environments.
* **Lifecycle:** Battery degradation and forced OS updates.

### The icaffeOS Solution: Custom Edge Terminals (<$100)

We deploy low-cost, high-performance Linux-based SBCs (Single Board Computers) paired with industrial-grade touch interfaces.

* **Thin-Client Logic:** All heavy processing is offloaded to the local Mac Mini/AGX Hub.
* **Web-Socket Streaming:** React 18 UI delivered with zero latency via local network.
* **Durability:** Fanless, ruggedized enclosures designed for high-heat, high-grease environments.
* **Cost Efficiency:** By shifting from general-purpose tablets to specialized Edge Terminals, we reduce terminal CapEx by 75%.

---

## 🛡️ Security

* **RLS (Row Level Security):** Supabase policies ensure data isolation between tenants (businesses).
* **Employee Roles:** Role-based access control (Admin, Manager, Shift Leader, Staff) effectively manages access to sensitive areas like Sales Reports and Inventory settings.

---

## 🎨 Theme

The application supports a robust theming system (Light/Dark mode) with consistent design tokens, ensuring high visibility in high-paced kitchen environments and elegant aesthetics for customer Kiosks.

---

## 💾 Database Backups

The project includes tools for generating database dumps from the remote Supabase production environment.

* **Latest Dump:** `remote_db_dump.sql` (Generated on 2026-01-27)
* **Status:** Contains 119 tables and 169 functions from the `public`, `auth`, `storage`, and `realtime` schemas.

*Powered by icaffeos* ☕
