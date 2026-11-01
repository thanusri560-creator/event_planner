# AuraPlan AI — Celebration & Event Optimization Engine
**Challenge 5: AI-Powered Celebration & Event Planner**

[![Live App](https://img.shields.io/badge/Live_App-Ready-success?style=for-the-badge&logo=google-cloud)](https://ais-pre-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app)
[![Tests Passing](https://img.shields.io/badge/Automated_Tests-23%2F23_Passed-emerald?style=for-the-badge&logo=vitest)](https://ais-pre-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app)
[![Model](https://img.shields.io/badge/Model-Gemini_3.8_Flash-purple?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2_AA_Compliant-blue?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **AuraPlan AI** is an intelligent full-stack event planning and optimization system. Rather than generating static checklists or simple chatbot replies, AuraPlan models interconnected real-world celebration constraints using deterministic algorithms: a **Priority-Aware Budget Optimization Engine**, a **Dependency DAG Timeline with Critical Path Method (CPM)**, and a **Mid-Flight What-If Stress Simulation Lab**, augmented with **Google Gemini AI** for negotiation scripts and operational trade-off reasoning.

---

## 🌐 Live Deployed Links

* **🚀 Shared Production App**: [https://ais-pre-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app](https://ais-pre-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app)
* **🛠️ Development Environment**: [https://ais-dev-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app](https://ais-dev-6cnysvz5kpmysupooar6yu-554095704087.asia-southeast1.run.app)

---

## 🎯 Core Evaluation Features

### 1. Dynamic Budget Optimization Engine (`src/logic/budgetOptimizer.ts`)
* **Priority Shielding**: Users categorize items into **High** (Essential/Must-Have), **Medium** (Flexible), and **Low** (First to trim). High-priority items (such as core catering and venue permits) are shielded from mandatory reductions.
* **Deterministic Rebalancing Algorithm**: When expenditures exceed the total budget, the engine detects the overrun, identifies reducible margins above minimum viable quality floors, and calculates proportional cuts across flexible tiers.
* **Granular Human-in-the-Loop Approvals**: Never silently alters user budgets. Generates an itemized proposal with interactive checkboxes, exact currency deltas, and qualitative impact explanations.
* **Gemini AI Negotiation Scripts**: Generates supplier scripts and psychological talking points to execute proposed discounts without damaging vendor relationships.

### 2. Dependency-Aware DAG Timeline Engine (`src/logic/dependencyScheduler.ts`)
* **Directed Acyclic Graph (DAG)**: Represents task dependencies as a DAG with cycle detection (Kahn's algorithm, $O(V+E)$).
* **Critical Path Method (CPM)**: Computes **Early Start (ES)**, **Early Finish (EF)**, **Late Start (LS)**, **Late Finish (LF)**, and **Total Float (Slack)** across forward and backward passes.
* **Delay Cascading**: When an upstream milestone (e.g. Venue Booking) slips, downstream tasks (*Stage Blueprint → Decoration Planning → Decor Setup* and *Invitations → RSVP → Headcount → Catering Confirmation*) automatically push forward.
* **Event-Day Conflict Alerts**: Tasks with zero slack are highlighted as the Critical Path. If any finish date breaches the celebration deadline, immediate negative-slack warnings and fast-track recommendations are displayed.

### 3. Mid-Flight What-If Stress Simulation Lab (`src/logic/scenarioSimulator.ts`)
* **Multi-Constraint Chaos Sandbox**: Lets planners inject unexpected mid-flight shocks (e.g. +50 guest surge, 15% sponsor budget cut, lead vendor cancellation, date compression).
* **Simultaneous Multi-Dimensional Recalculations**: Concurrently computes per-guest catering scaling, seating shortfall against venue capacity (e.g. 250 attendees vs. 220 venue seats), budget deficits, and timeline float compression.
* **Feasibility Index (0–100%)**: Rates scenario health as *Feasible*, *At Risk*, or *Critical Overrun*.
* **Actionable Recovery Plan & History**: Formulates concrete mitigation steps (e.g., activating backup vendors, fast-tracking setup crew) with before-and-after variance tables and 1-click commit/revert capability.

---

## 🎬 Challenge 5 Demonstration Walkthrough

A demonstration banner is pinned to the top of the application loaded with the official evaluation baseline:
- **Event**: College Annual Celebration
- **Guests**: 200 Attendees
- **Budget**: ₹2,00,000
- **Timeline**: 30-Day Planning Horizon

### 🔘 Scenario 1: Budget Overrun (+₹30,000)
1. Click **Scenario 1: Budget Overrun (+₹30k)** on the top banner.
2. Projected expenses spike to ₹2,30,000.
3. The **Budget Optimization Engine** immediately opens, showing proposed savings:
   - Preserves High-Priority **Venue** (₹45,000) and **Catering** (₹70,000).
   - Proposes cuts on Low-Priority **Decoration** (saves ₹18,000) and Medium-Priority **Photography** (saves ₹12,000).
4. Review itemized justifications, generate AI negotiation scripts, and approve the rebalancing.

### 🔘 Scenario 2: Venue Booking Delay (+3 Days)
1. Click **Scenario 2: Venue Delay (+3 Days)**.
2. Injects a 3-day delay on `Venue Booking & Campus Signoff`.
3. The DAG forward-pass propagates the delay downstream:
   - `Stage Layout` pushes from Day 3 to Day 6.
   - `Decoration Planning` pushes to Day 8.
   - Zero-slack critical path tasks update in real time with visual Gantt highlights.

### 🔘 Scenario 3: Mid-Flight Stress Test (+50 Pax / -15% Budget)
1. Click **Scenario 3: Stress Test (+50 Pax / -15% ₹)**.
2. Evaluates double constraint shock:
   - Headcount increases from 200 to 250 (+25%).
   - Budget cut by 15% to ₹1,70,000 ceiling.
3. Live Engine Output:
   - **Capacity Shortfall Alert**: 250 guests exceed the 220-seat Auditorium capacity by 30 people.
   - **Budget Deficit**: Catering costs scale with per-plate math against the smaller ₹1,70,000 budget.
   - **Composite Feasibility Score**: Calculated at 58% (*At Risk*).
   - **Algorithmic Recovery Plan**: Recommends lawn overflow annex, priority budget reallocations, and fast-track setup schedules.

---

## 🧪 Automated Testing Suite (23 Tests)

The repository features comprehensive automated tests runnable via CLI and directly inside the web UI:

```bash
npm test
```

### Test Breakdown
| Suite | Count | Key Test Assertions |
| :--- | :---: | :--- |
| **Unit Tests** | **7** | Allocation calculations, overrun detection, priority preservation, DAG CPM passes, delay cascading, critical path identification, per-plate scaling. |
| **Integration Tests** | **5** | Event creation & persistence, budget-to-dashboard state sync, multi-task delay propagation, catering headcount scaling, budget cut triggers. |
| **Edge-Case Tests** | **8** | Zero/negative budgets, negative guest counts, missing dependencies, circular task loop detection, multi-delay propagation, sub-floor budgets, venue capacity deficit, inverted deadlines. |
| **Stress Tests** | **3** | Synthetic **500+ task DAG scheduling** (<10ms runtime), **1,000+ guest headcount scaling**, **50 rapid consecutive mid-flight simulations**. |

> Inspect test logs, execution timings, and live assertions anytime under the **Test Suite** tab in the top navigation.

---

## 🏗️ Architecture & Tech Stack

```
├── server.ts                  # Full-stack Express entry point + Gemini 3.8 Flash proxy
├── src/
│   ├── logic/
│   │   ├── budgetOptimizer.ts      # Deterministic priority reallocation engine
│   │   ├── dependencyScheduler.ts  # DAG CPM scheduling, float math, topological sort
│   │   ├── scenarioSimulator.ts    # Mid-flight stress test engine & recovery planner
│   │   ├── eventPlanner.ts         # Event state manager, demo generator, persistence
│   │   └── geminiService.ts        # Client-side API client for server endpoints
│   ├── testing/
│   │   ├── testRunner.ts           # 23-test automated test suite
│   │   └── runCliTests.ts          # CLI test runner for npm test
│   ├── components/
│   │   ├── Navbar.tsx              # Responsive navigation & active event pill
│   │   ├── DemoScenarioBanner.tsx  # 1-click Challenge 5 scenario triggers
│   │   ├── BudgetOptimizationModal.tsx # Itemized approval modal with AI rationale
│   │   └── AICopilotModal.tsx      # Context-aware Gemini celebration consultant
│   ├── pages/
│   │   ├── LandingPage.tsx         # Modern hero & demo launcher
│   │   ├── DashboardPage.tsx       # KPI cards, category progress, critical path alerts
│   │   ├── BudgetPage.tsx          # Interactive line-item editor & priority selectors
│   │   ├── TimelinePage.tsx        # Interactive Gantt & delay propagation simulator
│   │   ├── SimulationPage.tsx      # Multi-variable What-If stress test lab
│   │   ├── VendorPage.tsx          # Vendor directory, SLAs, and backup swap controls
│   │   ├── CreateEventPage.tsx     # Event creation wizard with AI brief assistant
│   │   └── TestingPage.tsx         # In-app interactive test verification runner
│   ├── types/
│   │   └── index.ts                # Strict TypeScript domain interfaces
│   └── App.tsx                     # Top-level state coordinator & tab router
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend / AI**: Node.js, Express, `@google/genai` (Gemini 3.8 Flash).
- **Build & Dev Tooling**: Vite 8, `tsx`, ESLint.
- **Security & Privacy**: Zero API keys exposed to browser bundles; all LLM calls mediated via `/api/ai/*`.

---

## 💻 Local Setup & Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```
   Server will boot on `http://localhost:3000`.

3. **Run automated test suite**:
   ```bash
   npm test
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## ♿ Accessibility & Standards

- **WCAG 2.2 AA Compliance**: Full keyboard navigation support (Tab indexing, focus outlines, Escape listener on all modals).
- **Non-Color Dependent Indicators**: Never communicates status using color alone (uses explicit text labels like `CRITICAL`, `0d SLACK`, `FEASIBLE`, `AT RISK`, `PASS`).
- **Screen Reader Support**: Semantic HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`), `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `.sr-only` chart text summaries.
