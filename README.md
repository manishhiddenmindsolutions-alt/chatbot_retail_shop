# 🧥 Thread & Co. | Premium AI-Powered Fashion Boutique

*A luxury, minimalist React + TypeScript + Vite clothing catalog and chatbot interface powered by an intelligent n8n AI Stylist Agent.*

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Getting Started](#-getting-started)
5. [Project Directory Structure](#-project-directory-structure)
6. [API Webhook & Proxy Configuration](#-api-webhook--proxy-configuration)
7. [Design System & Aesthetics](#-design-system--aesthetics)
8. [License](#-license)

---

## 🌟 Overview

**Thread & Co.** (HMS Apparel Retail System) is a premium, high-end online retail concept boutique designed with a clean, glassmorphic, and minimalist aesthetic. The application showcases hand-tailored, classic wardrobe essentials and features a floating **AI Fashion Stylist Chatbot** widget that communicates in real-time with an n8n workflow. 

Users can browse clothing items, instantly add them to their shopping bag using natural language AI commands, ask about sizing/material specifications, or consult the AI stylist directly for coordinated seasonal outfit recommendation.

---

## ✨ Key Features

- **Curated Apparel Catalog**: Dynamic category filtering for essential wardrobe pieces (Hoodies, Jeans, T-Shirts) complete with rich metadata (SKU, rating, live stock count, price tag in INR, color, size, and styling status tags).
- **Interactive AI Prompting**: One-click actions to query the AI Agent about specific product sizes, materials, or to "Add to Bag via AI".
- **Intelligent Chat Overlay Widget**: A custom floating dialogue window that handles state transition, session management, Markdown messaging, and parsing of complex, multi-shaped JSON webhook responses.
- **Silent Connectivity Health Check**: A background ping on startup checks connection viability with the remote n8n agent, triggering a warning and localized stylist simulation fallback if the webhook is offline.
- **Responsive Premium Styling**: Designed with carefully curated HSL neutral palettes, high-contrast typography (Google Fonts *Plus Jakarta Sans* & *Playfair Display*), custom scrollbars, and fluid hover states.

---

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: *Plus Jakarta Sans* (Body/Sans), *Playfair Display* (Header/Serif), *Space Grotesk* (Monospace) via Google Fonts
- **Styling**: Pure CSS Variables (Vanilla CSS for performance and modular styling)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended) along with `npm`.

### Installation
1. Clone the project and navigate into the root directory:
   ```bash
   cd chatbot_retail_shop
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server with proxy routing enabled:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to interact with the application.

### Production Build
To compile the TypeScript code and bundle production-ready assets:
```bash
npm run build
```
To run a local server previewing the compiled production assets:
```bash
npm run preview
```

---

## 📁 Project Directory Structure

```text
chatbot_retail_shop/
├── public/                  # Static assets (favicons, metadata)
├── src/
│   ├── assets/              # Component images & custom icons
│   ├── components/          # Reusable UI Components
│   │   ├── ChatWidget.tsx   # Floating AI chatbot sidebar interface
│   │   ├── Header.tsx       # Navigation bar & system status badge
│   │   ├── Hero.tsx         # Welcome banner with quick AI actions
│   │   └── PropertyGrid.tsx # Apparel item listing grid & categories
│   ├── services/
│   │   └── agentService.ts  # Webhook connection, parsing, & mock data
│   ├── App.css              # Custom layout animations and micro-states
│   ├── App.tsx              # Main application entry layout
│   ├── index.css            # Global design token definitions & variables
│   └── main.tsx             # React DOM bootstrapping
├── eslint.config.js         # ESLint code style configurations
├── index.html               # Main entry HTML file & typography links
├── package.json             # Scripts & library dependencies
├── tsconfig.json            # TypeScript setup
└── vite.config.ts           # Vite server & API proxy configurations
```

---

## 🔌 API Webhook & Proxy Configuration

### Webhook Target
The application communicates with the n8n AI Agent at the following endpoint:
`https://n8n.propwiseai.in/webhook/94a57911-26f6-47c8-9eb3-cdac0c4faddd`

### Vite Local Proxy
To prevent **Cross-Origin Resource Sharing (CORS)** blocks during local development, Vite is configured in `vite.config.ts` to proxy requests starting with `/api-webhook`:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-webhook': {
        target: 'https://n8n.propwiseai.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-webhook/, '')
      }
    }
  }
})
```

### Response Parsing
The application service includes a robust `parseWebhookReply` utility in `src/services/agentService.ts` that safely decodes:
- Nested JSON data objects
- Stringified JSON wrapped in Markdown code blocks (` ```json ... ``` `)
- Plain text fallbacks
- Lists of returned item recommendations matching the catalog schema

---

## 🎨 Design System & Aesthetics

The typography and color tokens are loaded dynamically via custom properties in `src/index.css`:

```css
:root {
  /* Color Palette */
  --bg-primary: #fcfbfa;      /* Off-white luxury background */
  --bg-secondary: #ffffff;    /* Card & widget white */
  --bg-tertiary: #f4f2ef;     /* Soft warm grey accents */
  
  --text-primary: #181615;    /* Deep charcoal */
  --text-secondary: #504c48;  /* Muted charcoal */
  --text-muted: #8c857e;      /* Neutral taupe */
  
  --accent-orange: #d95a2b;   /* Terracotta orange focus */
  --accent-gold: #c39850;     /* Soft warm gold focus */
  --accent-rose: #bf3f5a;     /* Limited stock alert */
  --accent-emerald: #1c855a;  /* Available status green */

  /* Fonts */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-serif: 'Playfair Display', serif;
  --font-mono: 'Space Grotesk', monospace;
}
```
