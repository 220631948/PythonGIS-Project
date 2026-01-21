# Cape Town GeoHub 🌍📍

![React](https://img.shields.io/badge/React-v19-blue)
![Vite](https://img.shields.io/badge/Vite-v6-purple)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-green)
![Status](https://img.shields.io/badge/Status-Production-orange)

A modern, offline-capable GIS application for the City of Cape Town. Built to provide planners, officials, and citizens with instant access to Services, Transport, Safety, and Land Use data.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

## ✨ Key Features

*   **Offline First:** Works without internet. Caches map tiles and GeoJSON data using Service Workers and IndexedDB.
*   **No Backend Required:** Fully client-side architecture. Deploys to GitHub Pages or any static host.
*   **Spatial Intelligence:** Built-in analysis tools (Area, Length, Feature Counts) powered by Turf.js.
*   **Modularity:** 7 Distinct modules loaded on-demand for performance.

## 🏗️ Architecture to "Ship"

*   **Framework:** React 19 + TypeScript (partial)
*   **Build Tool:** Vite
*   **Mapping:** Leaflet + React-Leaflet
*   **State:** React Context + URL State (Shareable links)

## 📄 Documentation

*   [**Data Ethics & Limitations**](./ETHICS.md)
*   [**Data Sources**](./DATA_SOURCES.md)

---
*Built with ❤️ for Cape Town.*
