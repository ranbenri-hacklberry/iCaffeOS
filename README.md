<p align="center">
  <img src="docs/assets/icaffeos_logo.png" alt="icaffeOS Logo" width="200"/>
</p>

<h1 align="center">☕ icaffeOS</h1>

<p align="center">
  <strong>AI-Native · Offline-First · Sovereign Agentic Infrastructure</strong>
</p>

<p align="center">
  <em>The Operational System that transitions hospitality businesses from Stateless SaaS Dependency to full Data Sovereignty.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Cost%20Savings-80%25–100%25-brightgreen?style=for-the-badge" alt="AI Savings"/>
  <img src="https://img.shields.io/badge/Data%20Sovereignty-100%25%20Local-blue?style=for-the-badge" alt="Data Sovereignty"/>
  <img src="https://img.shields.io/badge/Offline%20Ready-Yes-orange?style=for-the-badge" alt="Offline Ready"/>
  <img src="https://img.shields.io/badge/SaaS%20Fees-$0-red?style=for-the-badge" alt="$0 SaaS"/>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-hardware-tiers">Hardware Tiers</a> •
  <a href="#-key-modules">Key Modules</a> •
  <a href="#-local-inference">Local Inference</a> •
  <a href="#%EF%B8%8F-data-sovereignty--privacy">Data Sovereignty</a> •
  <a href="#-license">License</a>
</p>

---

## 📖 Overview

**icaffeOS** is a full-stack operational system purpose-built for cafes, restaurants, and hospitality businesses. It runs entirely on local hardware — no recurring SaaS fees, no cloud lock-in, **no data leakage**.

The system combines a **deterministic transactional core** with an **AI-native extensibility layer**, giving operators real-time POS, kitchen display, task management, audio ambiance control, and intelligent business insights — all running on-premise.

> 💡 **The Bottom Line:** By running AI models locally on your own hardware, icaffeOS delivers **80–100% savings** on AI service costs compared to cloud-based alternatives (OpenAI, Google, etc.). A typical café spends $200–$500/month on AI APIs, SaaS tools, and cloud inference. With icaffeOS, **that cost drops to $0** after the one-time hardware investment.

### Why icaffeOS?

| Traditional SaaS | icaffeOS |
|---|---|
| $200–$500/month on AI API fees | **80–100% savings** — local inference, $0 API costs |
| Monthly subscription fees per terminal | **$0 recurring costs** — you own the hardware |
| Customer data stored on vendor's cloud | **100% data sovereignty** — everything stays on your machine |
| AI conversations routed through third-party servers | **Private AI** — models run locally, nothing leaves your network |
| Offline = dead | **Offline-first** — full operation without internet |
| Vendor lock-in | **Open architecture** — extend via natural language prompts |
| Generic, one-size-fits-all | **AI-adaptive** — the system learns your business |

### Your Data, Your Rules

icaffeOS was built on a simple principle: **your business data belongs to you — not to a SaaS vendor, not to a cloud provider, and certainly not to an AI company's training pipeline.**

Every transaction, every customer interaction, every AI-generated insight stays within your own infrastructure. No telemetry is sent externally. No data is used to train third-party models. When you ask Maya a question about your revenue, the answer is computed _on your hardware_ using _your data_ — and the conversation never leaves your network.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| **OS** | icaffeOS Sovereign Node | Sovereign OS Core |
| **CPU** | Apple M4 / NVIDIA AGX Orin | Apple M4 Pro / NVIDIA AGX Thor |
| **RAM** | 16 GB (Unified Memory) | 32 GB+ |
| **Storage** | 128 GB NVMe SSD | 512 GB+ NVMe SSD |
| **Node.js** | v18.x | v20.x LTS |
| **PostgreSQL** | 15 (via Supabase) | Supabase Self-Hosted |
| **Docker** | v24+ | v25+ with Compose v2 |
| **Network** | LAN connectivity | Tailscale installed for Zero-Trust Mesh |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/icaffeos.git
cd icaffeos

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and system configuration

# 4. Start the local Supabase stack (if self-hosting)
docker compose up -d

# 5. Run database migrations
npm run migrate

# 6. Start the application
npm run dev
```

### Environment Configuration

Create a `.env` file in the project root with the following keys:

```env
# ── System ──────────────────────────────────────
NODE_ENV=production
PORT=8081

# ── Supabase (Local) ───────────────────────────
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# ── Supabase (Cloud — for sync) ────────────────
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-cloud-anon-key>

# ── Tailscale (Zero-Trust Mesh) ────────────────
TAILSCALE_AUTH_KEY=<your-tailscale-auth-key>
```

### Running on Electron (Desktop App)

```bash
# Build and launch the desktop application
npm run electron:build
npm run electron:start
```

---

## 🏗️ Architecture

icaffeOS is built on a **two-layer architecture**: an **Immutable Core** that guarantees data integrity, and a **flexible SDK** for AI-native extensibility.

```
┌─────────────────────────────────────────────────────────┐
│                    SDK Layer (Mutable)                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐│
│  │  Maya AI  │  │  Cortex  │  │  Prompt-Driven UI SDK  ││
│  │ Assistant │  │ RAG Hub  │  │  (React 18 + Framer)   ││
│  └──────────┘  └──────────┘  └────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                 Immutable Core (Sacred)                  │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │  PostgreSQL   │  │  Dexie.js │  │    Tailscale     │ │
│  │  PL/pgSQL     │  │ IndexedDB │  │  Zero-Trust Mesh │ │
│  │  Atomic Txns  │  │  Mirror   │  │  (WireGuard)     │ │
│  └──────────────┘  └───────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### The Immutable Core

The core is the **non-negotiable** layer. It is never modified by the SDK or AI agents.

- **Database:** PostgreSQL 15 (Supabase) with `PL/pgSQL` Atomic Transactions (e.g., `submit_order_v3`) ensuring ledger-grade consistency.
- **Security:** `SECURITY DEFINER` RPCs prevent data injection and enforce row-level security at the database edge.
- **Offline Persistence:** [Dexie.js](https://dexie.org/) maintains a full IndexedDB mirror locally. The system operates at 100% during internet outages, with automatic background cloud sync on reconnect.
- **Networking:** [Tailscale](https://tailscale.com/) (WireGuard) Zero-Trust Mesh. No open ports. All traffic is encrypted end-to-end.

### The SDK (AI-Native Extensibility)

The SDK allows the system to be adapted and extended **without touching the core**.

- **Prompt-Driven UI:** Authorized users can modify screens or create entirely new interfaces using natural language prompts. Built on React 18 + Framer Motion.
- **Logic Injection:** Add business rules, new agent behaviors, and custom workflows via the SDK's plugin system.
- **Maya:** The personal AI assistant, powering the Manager Dashboard. Handles natural language queries about operations, revenue, and staff.
- **Cortex:** The RAG (Retrieval-Augmented Generation) engine. Processes customer feedback, reviews, and operational data to surface actionable business insights.

---

## 💻 Hardware Tiers

icaffeOS dynamically detects available compute resources and adjusts the complexity of its Agentic Loop accordingly.

### Tier 1 — Local Edge · _The "On-Site" Unit_

| Spec | Details |
|---|---|
| **Hardware** | Apple Mac Mini (M4), NVIDIA AGX Orin/Thor |
| **RAM** | 16–32 GB (Unified Memory) |
| **Terminals** | icaffeOS Custom SBC Edge Terminals (<$100) |

**Capabilities:**

- ✅ Full POS & KDS with zero-latency sync
- ✅ Local inference for 7B–8B models (Llama 3.1 8B)
- ✅ Real-time rantunes audio management
- ✅ Complete offline operation — **$0 SaaS fees**

---

### Tier 2 — Office / Studio Hub · _Performance Intelligence_

> **Target:** Restaurant groups, management offices, 3–10 locations.

| Spec | Details |
|---|---|
| **Hardware** | PC with RTX 3090/4090 (24 GB VRAM), Mac Studio (M2/M3 Ultra) |
| **RAM** | 32–128 GB |
| **Budget** | ~$2,000–$5,000 |

**Capabilities:**

- ✅ Centralized Maya Assistant for multi-tenant management
- ✅ High-parameter inference (14B–70B models) for deep business insights
- ✅ Cortex RAG Hub — process massive customer feedback across branches
- ✅ Multi-location real-time dashboards

---

### Tier 3 — Enterprise Grade · _The Sovereign Cloud_

> **Target:** Global coffee chains, hotel franchises, retail conglomerates.

| Spec | Details |
|---|---|
| **Hardware** | NVIDIA DGX Spark, H100/A100 Clusters, HPC nodes |
| **RAM** | 256 GB+ |
| **Budget** | $10,000+ |

**Capabilities:**

- ✅ Massive-scale inference for hundreds of concurrent agents
- ✅ Real-time global inventory optimization & predictive supply chain
- ✅ Full Data Sovereignty — private LLM backbone for entire franchise
- ✅ Zero data leakage to public clouds

---

## 🧩 Key Modules

| Module | Description |
|---|---|
| **POS** | Dynamic point-of-sale with multi-business support, loyalty integration ($BEAN), and instant order submission via `submit_order_v3`. |
| **KDS** | Real-time Kitchen Display System with state-sync, animated order cards, and dog-style celebration animations. |
| **Kanban** | Integrated task management board for staff scheduling and operational workflows. |
| **rantunes** 🎵 | Local-first audio engine. No Spotify dependency — full control over venue ambiance from any device. Supports external SSD music libraries. |
| **Menu AI** | Generative photo engine for real-time menu updates. Creates branded item images using local or cloud AI models. |
| **Maya** 🤖 | AI-powered Manager Assistant. Natural language interface for operations, revenue analysis, and staff management. |
| **Cortex** 🧠 | RAG engine that processes reviews, feedback, and operational history to generate actionable business insights. |
| **Wallet** | Crypto-native loyalty system ($BEAN). 1 cup = 1 $BEAN, 9 $BEAN = 1 free coffee. On-chain transparency. |
| **Marketing** | AI-assisted marketing post generation with logo compositing and branded templates. |
| **SMS Gateway** | Hybrid SMS delivery with local modem (serial port) primary and cloud provider fallback. |

---

## 🧠 Local Inference

icaffeOS is designed for **$0 API costs** by running models locally via [Ollama](https://ollama.com/) or [vLLM](https://docs.vllm.ai/). This is the core of the system's privacy guarantee — **your prompts, your business data, and your AI conversations never leave your machine.**

### Local vs. External AI Engines

| | 🏠 Local Inference (icaffeOS) | ☁️ Cloud APIs (OpenAI, Google, etc.) |
|---|---|---|
| **Cost** | **$0 per query** — one-time hardware investment | $0.002–$0.06 per 1K tokens, scales with usage |
| **Privacy** | ✅ Data never leaves your network | ❌ Prompts sent to third-party servers |
| **Data Training** | ✅ Your data is never used for model training | ⚠️ May be used to improve vendor models |
| **Latency** | ⚡ ~50–200ms (on-device) | 🐢 ~500–3000ms (network round-trip) |
| **Availability** | ✅ Works offline, 24/7 | ❌ Requires internet, subject to outages |
| **Compliance** | ✅ Full GDPR / data residency compliance | ⚠️ Data crosses jurisdictions |
| **Monthly Cost (typical café)** | **$0** | **$200–$500+** |

> 🔒 **Privacy Guarantee:** When Maya answers a question about your sales, or Cortex analyzes customer feedback, the entire computation happens on your hardware. The prompts, the context, and the responses — none of it touches an external server.

### Recommended Models

| Model | Parameters | Use Case | Min. VRAM |
|---|---|---|---|
| **Llama 3.1** | 8B | Maya conversational AI, business forecasting | 6 GB |
| **Mistral-Nemo** | 12B | Daily operational tasks, KDS logic, workhorse model | 8 GB |
| **Llama 3.1** | 70B | Deep reasoning, complex multi-step analysis | 40 GB |
| **Minimax M2.5 / GLM-5** | — | High-level agentic reasoning, complex tool-calling | 24 GB+ |

### Running Models Locally

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull recommended models
ollama pull llama3.1:8b        # Tier 1 — Edge nodes
ollama pull mistral-nemo       # Tier 1–2 — Workhorse
ollama pull llama3.1:70b       # Tier 2–3 — Heavy reasoning

# Verify
ollama list
```

> 💡 **Hybrid Mode:** icaffeOS supports optional cloud API fallback (Gemini, Grok) for businesses that choose to use it — but it is **never required**. The system is fully functional with local models only.

---

## 🛡️ Data Sovereignty & Privacy

Data sovereignty isn't a feature of icaffeOS — it's the **foundation**. The entire system is architected so that sensitive business data, customer information, and AI interactions remain under the operator's exclusive control.

### How Your Data is Protected

| Layer | Protection |
|---|---|
| **Transactions** | All orders processed via `SECURITY DEFINER` PL/pgSQL functions — no raw SQL from clients |
| **Storage** | PostgreSQL with Row-Level Security (RLS) — multi-tenant isolation at the database level |
| **AI Conversations** | Maya & Cortex run on local models — prompts and responses never leave your network |
| **Network** | Tailscale Zero-Trust Mesh (WireGuard) — no open ports, end-to-end encryption |
| **Secrets** | API keys stored in a dedicated `business_secrets` table with restricted access policies |
| **Offline Cache** | Dexie.js (IndexedDB) encrypted local mirror — works without any cloud connection |

### Cortex: Local-First Knowledge Engine

**Cortex** is icaffeOS's RAG (Retrieval-Augmented Generation) engine. It processes customer reviews, operational logs, sales data, and staff feedback to generate actionable business insights.

**How Cortex data is managed:**

1. **Ingestion:** Data is collected from local sources only — your POS transactions, your Google Reviews sync, your staff notes. No third-party data brokers.
2. **Vectorization:** Text is embedded into vector representations using **local embedding models** (e.g., `nomic-embed-text`). The embedding process runs entirely on your hardware.
3. **Storage:** Vector embeddings are stored in your **local PostgreSQL instance** (via `pgvector`), not in any external vector database service.
4. **Retrieval:** When a manager asks Maya "How did we perform last month?", Cortex retrieves relevant context from the local vector store and feeds it to the local LLM. **The entire RAG pipeline — embedding, retrieval, and generation — executes on-premise.**
5. **Deletion:** Business owners have full control. Delete a record, and its vector embedding is purged from the local database immediately. No ghost copies on external servers.

> 🔐 **Key Principle:** Cortex is designed so that even if a business later decides to connect a cloud AI provider for enhanced capabilities, **the Cortex knowledge base itself never leaves the local infrastructure.** Cloud models receive only the minimal context needed for a specific query, and responses are processed locally.

### Security Infrastructure

- **Zero-Trust Networking:** All inter-node communication is encrypted via Tailscale (WireGuard). No ports are ever exposed to the public internet.
- **Row-Level Security:** PostgreSQL RLS policies ensure multi-tenant data isolation at the database level.
- **SECURITY DEFINER RPCs:** Critical operations (order submission, inventory decrement) are executed as trusted database functions, preventing client-side data injection.
- **Secrets Management:** API keys and tokens are stored in a dedicated `business_secrets` table, never in the main `businesses` table.
- **Offline-First Security:** Authentication tokens and business data are cached locally in encrypted IndexedDB stores.
- **No Telemetry:** icaffeOS sends zero analytics, usage data, or telemetry to any external server. Ever.

---

## 🌐 Network Topology

```
  ┌──────────────┐        Tailscale Mesh (WireGuard)        ┌──────────────┐
  │   Edge Node  │◄────────────────────────────────────────►│  Office Hub  │
  │  (Cafe POS)  │         Encrypted · No Open Ports        │ (Mac Studio) │
  └──────┬───────┘                                          └──────┬───────┘
         │                                                         │
         │  Dexie.js ←→ Supabase Sync                              │
         │  (Background, Non-Blocking)                             │
         ▼                                                         ▼
  ┌──────────────┐                                          ┌──────────────┐
  │   Local PG   │                                          │  Cloud PG    │
  │  (Optional)  │                                          │  (Supabase)  │
  └──────────────┘                                          └──────────────┘
```

---

## 📂 Project Structure

```
icaffeos/
├── frontend_source/          # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level views (POS, KDS, Menu, etc.)
│   │   ├── services/         # Supabase client, sync logic, secrets
│   │   └── hooks/            # Custom React hooks
│   ├── supabase/
│   │   └── migrations/       # PostgreSQL migration files
│   └── scripts/              # Utility scripts (stock updates, cleanup)
├── backend/                  # Node.js backend server
│   ├── routes/               # API routes (marketing, SMS, AI)
│   └── services/             # Business logic services
├── electron/                 # Electron desktop wrapper
├── docs/                     # Documentation and assets
├── docker-compose.yml        # Local Supabase & service orchestration
├── .env.example              # Environment variable template
└── README.md                 # ← You are here
```

---

## 🛣️ Roadmap

- [x] POS & KDS with real-time sync
- [x] Offline-first with Dexie.js persistence
- [x] rantunes local audio engine
- [x] Maya AI Assistant (Manager Dashboard)
- [x] $BEAN crypto loyalty wallet
- [x] Menu AI — generative menu photos
- [x] Zero-Trust networking via Tailscale
- [x] SMS Gateway with modem + cloud fallback
- [ ] Cortex RAG v2 — multi-source feedback aggregation
- [ ] Predictive inventory & supply chain (Tier 3)
- [ ] Multi-language SDK documentation
- [ ] Plugin marketplace for community extensions

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.  
For licensing inquiries, contact: [ranbenri@gmail.com](mailto:ranbenri@gmail.com)

---

<p align="center">
  Built with ❤️ for the hospitality industry.<br/>
  <strong>Own your data. Own your operations. Own your future.</strong>
</p>
