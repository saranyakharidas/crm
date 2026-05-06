# 🛡️ NexusCRM - Advanced AI-Powered Customer Relationship Management

NexusCRM is a modern, high-performance customer relationship management platform designed for high-velocity sales and support teams. Built with a focus on usability, AI-driven insights, and seamless automation.

## ✨ Features

- **📊 Intelligent Dashboard**: Real-time analytics with Recharts, KPI tracking, and automated AI insights.
- **💼 Sales Pipeline**: Interactive Kanban board to manage deals from Lead to Won.
- **👥 Contact Management**: Comprehensive lead and account tracking with activity timelines.
- **⚡ Automated Workflows**: Rule-based lead assignment, recurring tasks, and automation triggers.
- **🎟️ Integrated Support**: Built-in ticketing system to manage customer requests.
- **📈 Advanced Analytics**: Deep-dive insights into revenue performance, conversion rates, and lead sources.
- **📅 Smart Calendar**: Automated scheduling and task management.

## 🛠️ Technical Architecture

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Shadcn/UI
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **State Management**: React Context API
- **Form Management**: React Hook Form + Zod
- **Type Safety**: TypeScript 100%

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd nexus-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```text
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
│   ├── crm/              # Core CRM business components
│   └── ui/               # Base Shadcn/UI components
├── lib/                  # Utility functions, contexts, and mock data
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── styles/               # Global CSS and themes
```

## 💎 Design Philosophy

NexusCRM leverages a **Glassmorphic Dark Mode** aesthetic with high-contrast accents to provide a premium, modern feel. The UI is designed for speed and clarity, minimizing clicks to access critical data.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by the NexusCRM Team
