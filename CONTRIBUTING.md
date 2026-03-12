# Contributing to icaffeOS

First off, thank you for considering contributing to icaffeOS. We are building the world’s first sovereign, AI-native infrastructure for the hospitality industry, and we hold our codebase to the highest engineering standards.

As a Staff-led project, we prioritize **Data Integrity**, **Hardware Efficiency**, and **Deterministic Logic**.

## 🏗️ Architectural Principles

Before you open a Pull Request, understand our core constraints:

* **Immutable Core:** The database layer (PostgreSQL) and atomic transactions are "Sacred". Logic must be handled via PL/pgSQL RPCs, not client-side manipulation.
* **Offline-First:** Every feature must function without an active internet connection using our Dexie.js local mirror.
* **Hardware-Aware:** Code must be optimized for Apple Silicon (Metal) and NVIDIA CUDA/Tensor Cores. We do not support generic, unoptimized compute paths.

## 🛠️ Development Workflow

### 1. Branching Strategy

We use a truncated Git Flow:

* **main:** Production-ready, stable releases only.
* **develop:** Integration branch for new features.
* **feature/feature-name:** Individual feature branches.

### 2. Code Standards

* **Frontend:** React 18 (Functional Components), TailwindCSS, Framer Motion for animations.
* **Database:** Always use `SECURITY DEFINER` for RPC functions. No raw SQL strings in the frontend.
* **Telemetry:** Ensure all hardware heartbeat logs use the **Edge Hub** branding.

## 🧪 Testing Requirements

We don't ship "hope". We ship verified logic.

* **Unit Tests:** All business logic in the SDK layer must have 80%+ coverage.
* **Hardware Validation:** If you are modifying the AI/Inference modules, you must verify the build on at least one Sovereign Node (M4 or AGX).
* **Migration Integrity:** Any change to the schema must include a reversible migration script in `/supabase/migrations`.

## 🤝 Pull Request Process

1. **Self-Review:** Read your own code. Check for sensitive data in logs.
2. **Atomic Commits:** Keep commits small and focused.
3. **Documentation:** Update the `README.md` or `/docs` if you change hardware requirements or environment keys.
4. **Approval:** All PRs require a review from the Systems Architect (**Ran Ben Ari**) or a designated Maintainer.

## ⚖️ License & IP

By contributing, you agree that your contributions will be licensed under the project's proprietary license. We protect our Data Sovereignty and that of our merchants.
