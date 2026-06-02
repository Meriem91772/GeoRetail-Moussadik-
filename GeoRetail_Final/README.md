# 🗺️ GeoRetail MVP - Version Finale

## Plateforme de Cartographie des Points de Vente au Maroc

**Projet de Fin d'Études - Master DSIA**  
**École Centrale Casablanca - 2024/2025**

---

## 📋 Description

GeoRetail est une plateforme innovante de cartographie et de collecte automatisée des points de vente au Maroc. Elle combine des sources de données gratuites (OpenStreetMap, Nominatim) avec une interface moderne pour visualiser, analyser et exporter les données commerciales.

## 🚀 Démarrage Rapide

### 1. Installation

```bash
# Créer un environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 2. Lancer l'application

```bash
uvicorn main:app --reload
```

### 3. Accéder à l'interface

- **Interface Web**: http://localhost:8000
- **Documentation API**: http://localhost:8000/docs

---

## 📊 Fonctionnalités

### ✅ Collecte de Données
- **OpenStreetMap** : Collecte automatique via Overpass API (GRATUIT)
- **Import CSV/JSON** : Import de fichiers externes
- **Ajout Manuel** : Formulaire d'ajout de POS

### ✅ Visualisation
- **Carte Interactive** : Leaflet.js avec clustering
- **Filtres Avancés** : Par région, type, enseigne, catégorie
- **Statistiques** : Graphiques et indicateurs clés

### ✅ Export
- **CSV** : Export tableur
- **GeoJSON** : Export cartographique

### ✅ API REST Complète
- CRUD complet sur les POS
- Recherche géographique (nearby, bbox)
- Statistiques agrégées

---

## 🗂️ Structure du Projet

```
GeoRetail_Final/
├── main.py                    # Backend FastAPI
├── index.html                 # Interface utilisateur
├── georetail_database.json    # Base de données JSON
├── requirements.txt           # Dépendances Python
└── README.md                  # Documentation
```

---

## 🌍 Collecte OpenStreetMap

### Régions Supportées

| Région | Ville Principale |
|--------|------------------|
| Casablanca-Settat | Casablanca |
| Rabat-Salé-Kénitra | Rabat |
| Marrakech-Safi | Marrakech |
| Fès-Meknès | Fès |
| Tanger-Tétouan-Al Hoceïma | Tanger |
| Souss-Massa | Agadir |
| Oriental | Oujda |
| Béni Mellal-Khénifra | Béni Mellal |
| Drâa-Tafilalet | Errachidia |

### Types de Commerces Collectés

- Supermarchés et hypermarchés
- Épiceries et commerces de proximité
- Boulangeries, boucheries, primeurs
- Marchés traditionnels
- Centres commerciaux

---

## 📡 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/pos` | Liste des POS (avec filtres) |
| POST | `/pos` | Créer un POS |
| GET | `/pos/{id}` | Détails d'un POS |
| DELETE | `/pos/{id}` | Supprimer un POS |
| POST | `/collect/osm` | Lancer collecte OSM |
| GET | `/collect/status` | Statut de la collecte |
| POST | `/import/csv` | Import CSV |
| POST | `/import/json` | Import JSON |
| GET | `/pos/search/nearby` | Recherche par proximité |
| GET | `/pos/search/bbox` | Recherche par zone |
| GET | `/stats` | Statistiques globales |
| GET | `/export/csv` | Export CSV |
| GET | `/export/geojson` | Export GeoJSON |

---

## 📈 Statistiques Actuelles

- **~2,976 POS** dans la base de données
- **12 régions** couvertes
- **100% Open Source**

---

## 🔧 Technologies Utilisées

### Backend
- **FastAPI** : Framework API moderne et performant
- **Pydantic** : Validation des données
- **HTTPX** : Client HTTP asynchrone

### Frontend
- **Leaflet.js** : Cartographie interactive
- **Chart.js** : Graphiques statistiques
- **MarkerCluster** : Regroupement des marqueurs

### Sources de Données
- **OpenStreetMap** : Données collaboratives mondiales
- **Overpass API** : Requêtes spatiales OSM
- **Nominatim** : Géocodage gratuit

---

## 📝 Licence

Projet académique - École Centrale Casablanca

---

## 👨‍💻 Auteur

Étudiant Master DSIA - École Centrale Casablanca
