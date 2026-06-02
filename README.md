<div align="center">

# GeoRetail x Moussadik

**Geo-Intelligence Platform for Mapping & Census of Points of Sale across Morocco**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

</div>

---

## About

This monorepo contains **two complementary applications** developed for the GeoRetail project at **Ecole Centrale Casablanca** (2024/2025):

| Application | Description | Tech Stack |
|-------------|-------------|------------|
| **GeoRetail MVP** | Automated POS mapping platform with OpenStreetMap data collection, interactive visualization, and REST API | FastAPI, Leaflet.js, Chart.js |
| **Moussadik Census** | Crowdsourced POS confirmation app with AI-powered validation using Gemini and gamification system | React 19, TypeScript, Gemini AI |

---

## Architecture

```
GeoRetail-Moussadik/
|
|-- GeoRetail_Final/          # Backend API + Web Dashboard
|   |-- main.py               # FastAPI application (25+ endpoints)
|   |-- index.html            # Interactive map dashboard
|   |-- georetail_database.json
|   |-- requirements.txt
|   +-- docs/                 # Executive summary (PDF + LaTeX)
|
|-- Moussadik-POS-Census/     # React Mobile-First App
|   |-- App.tsx               # Main application
|   |-- components/           # UI components
|   |-- services/             # Gemini AI integration
|   |-- utils/                # Geolocation utilities
|   +-- package.json
|
+-- README.md
```

---

## GeoRetail MVP - Features

### Data Collection
- **OpenStreetMap** automated collection via Overpass API (free)
- **CSV/JSON import** for external datasets
- **Manual entry** with form validation
- Coverage: **9 regions**, **~2,976 POS** mapped

### Interactive Visualization
- **Leaflet.js** map with marker clustering
- Advanced filters (region, type, brand, category)
- Real-time statistics with **Chart.js**

### REST API (25+ Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/pos` | List POS with filters |
| `POST` | `/pos` | Create a POS |
| `POST` | `/collect/osm` | Launch OSM collection |
| `GET` | `/pos/search/nearby` | Proximity search |
| `GET` | `/stats` | Global statistics |
| `GET` | `/export/csv` | Export to CSV |
| `GET` | `/export/geojson` | Export to GeoJSON |

---

## Moussadik POS Census - Features

- **Crowdsourced validation**: Users confirm POS existence on-site via GPS
- **Gemini AI integration**: Intelligent POS data enrichment and validation
- **Gamification**: Points system with rewards for active contributors
- **Dual roles**: Consumer (confirm POS) and Owner (manage listings)
- **Geolocation**: Real-time GPS tracking with proximity detection
- **POS Types**: Cafes, Restaurants, Epiceries, Supermarches, Grande Surfaces

---

## Quick Start

### GeoRetail MVP (Backend + Dashboard)

```bash
cd GeoRetail_Final
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# Dashboard: http://localhost:8000 | API Docs: http://localhost:8000/docs
```

### Moussadik Census (React App)

```bash
cd Moussadik-POS-Census
npm install
# Set GEMINI_API_KEY in .env.local
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | FastAPI, Pydantic, HTTPX (async) |
| **Frontend (Map)** | Leaflet.js, Chart.js, MarkerCluster |
| **Frontend (Census)** | React 19, TypeScript, Vite 6 |
| **AI** | Google Gemini AI |
| **Data Sources** | OpenStreetMap, Overpass API, Nominatim |
| **GIS** | GeoJSON, Leaflet, Geolocation API |

---

## Authors

**El Houssine KAMILI** - Engineering Student, Ecole Centrale Casablanca

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/el-houssine-kamili-2565a6351/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white)](https://github.com/elhoussine-arise)

---

<div align="center">

*Academic Project - Ecole Centrale Casablanca - 2024/2025*

</div>