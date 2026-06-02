"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GeoRetail MVP - Version Finale                            ║
║              Plateforme de Cartographie des Points de Vente au Maroc         ║
║                                                                              ║
║  Projet de Fin d'Études - Master DSIA                                        ║
║  École Centrale Casablanca - 2024/2025                                       ║
║                                                                              ║
║  Sources de données:                                                         ║
║  • OpenStreetMap (Overpass API) - Gratuit                                    ║
║  • Nominatim (Géocodage) - Gratuit                                           ║
║  • Import manuel (CSV/JSON)                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from contextlib import asynccontextmanager
import json
import csv
import io
import math
import uuid
import os
import httpx
import asyncio

# =====================================================
# MODELS & ENUMS
# =====================================================

class CommerceType(str, Enum):
    MODERNE = "moderne"
    TRADITIONNEL = "traditionnel"

class CommerceCategory(str, Enum):
    HYPERMARCHE = "hypermarché"
    SUPERMARCHE = "supermarché"
    SUPERETTE = "supérette"
    FRANCHISE = "franchise"
    HARD_DISCOUNT = "hard_discount"
    EPICERIE = "épicerie"
    DROGUERIE = "droguerie"
    BOULANGERIE = "boulangerie"
    PRIMEUR = "primeur"
    BOUCHERIE = "boucherie"
    POISSONNERIE = "poissonnerie"
    AUTRE = "autre"

class Region(str, Enum):
    CASABLANCA_SETTAT = "Casablanca-Settat"
    RABAT_SALE_KENITRA = "Rabat-Salé-Kénitra"
    MARRAKECH_SAFI = "Marrakech-Safi"
    FES_MEKNES = "Fès-Meknès"
    TANGER_TETOUAN_ALHOCEIMA = "Tanger-Tétouan-Al Hoceïma"
    SOUSS_MASSA = "Souss-Massa"
    ORIENTAL = "Oriental"
    BENI_MELLAL_KHENIFRA = "Béni Mellal-Khénifra"
    DRAA_TAFILALET = "Drâa-Tafilalet"
    LAAYOUNE_SAKIA_ELHAMRA = "Laâyoune-Sakia El Hamra"
    GUELMIM_OUED_NOUN = "Guelmim-Oued Noun"
    DAKHLA_OUED_EDDAHAB = "Dakhla-Oued Ed-Dahab"

class DataSource(str, Enum):
    GOOGLE_PLACES = "google_places"
    OPENSTREETMAP = "openstreetmap"
    COLLECTE_TERRAIN = "collecte_terrain"
    IMPORT_CSV = "import_csv"
    IMPORT_JSON = "import_json"
    AJOUT_MANUEL = "ajout_manuel"
    NOMINATIM = "nominatim"

class PointOfSale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])
    nom: str
    type: CommerceType
    categorie: CommerceCategory
    enseigne: Optional[str] = None
    adresse: str
    ville: str
    region: Region
    code_postal: Optional[str] = None
    latitude: float
    longitude: float
    telephone: Optional[str] = None
    horaires: Optional[str] = None
    surface_m2: Optional[int] = None
    nombre_employes: Optional[int] = None
    source: DataSource
    score_confiance: float = Field(ge=0, le=100, default=50.0)
    date_creation: datetime = Field(default_factory=datetime.now)
    date_mise_a_jour: datetime = Field(default_factory=datetime.now)
    actif: bool = True
    verifie: bool = False
    osm_id: Optional[str] = None

class POSCreate(BaseModel):
    nom: str
    type: CommerceType
    categorie: CommerceCategory
    enseigne: Optional[str] = None
    adresse: str
    ville: str
    region: Region
    latitude: float
    longitude: float
    telephone: Optional[str] = None
    horaires: Optional[str] = None
    surface_m2: Optional[int] = None
    nombre_employes: Optional[int] = None

# =====================================================
# CONFIGURATION
# =====================================================

DATABASE_FILE = "georetail_database.json"
DATABASE: List[dict] = []

COLLECT_STATUS: Dict[str, Any] = {
    "is_running": False,
    "last_run": None,
    "last_result": None,
    "progress": 0,
    "message": ""
}

# Configuration des régions pour la collecte OSM
# Format: (south, west, north, east) = (min_lat, min_lon, max_lat, max_lon)
REGIONS_CONFIG = {
    "Casablanca-Settat": {"bbox": (32.5, -8.5, 34.0, -7.0), "main_city": "Casablanca"},
    "Rabat-Salé-Kénitra": {"bbox": (33.5, -7.5, 34.5, -6.0), "main_city": "Rabat"},
    "Marrakech-Safi": {"bbox": (31.0, -9.5, 32.5, -7.5), "main_city": "Marrakech"},
    "Fès-Meknès": {"bbox": (33.0, -6.0, 34.5, -4.0), "main_city": "Fès"},
    "Tanger-Tétouan-Al Hoceïma": {"bbox": (34.5, -6.5, 35.9, -4.0), "main_city": "Tanger"},
    "Souss-Massa": {"bbox": (29.5, -10.0, 31.0, -8.5), "main_city": "Agadir"},
    "Oriental": {"bbox": (33.5, -3.5, 35.5, -1.5), "main_city": "Oujda"},
    "Béni Mellal-Khénifra": {"bbox": (31.5, -7.5, 33.0, -5.5), "main_city": "Béni Mellal"},
    "Drâa-Tafilalet": {"bbox": (30.0, -6.5, 32.5, -3.5), "main_city": "Errachidia"},
    "Laâyoune-Sakia El Hamra": {"bbox": (25.0, -15.0, 28.0, -12.0), "main_city": "Laâyoune"},
    "Guelmim-Oued Noun": {"bbox": (27.5, -11.0, 29.5, -9.0), "main_city": "Guelmim"},
    "Dakhla-Oued Ed-Dahab": {"bbox": (21.0, -17.0, 24.5, -14.0), "main_city": "Dakhla"},
}

# Mapping des types de shops OSM vers nos catégories
OSM_CATEGORY_MAPPING = {
    "supermarket": ("moderne", "supermarché"),
    "department_store": ("moderne", "hypermarché"),
    "mall": ("moderne", "hypermarché"),
    "convenience": ("traditionnel", "épicerie"),
    "grocery": ("traditionnel", "épicerie"),
    "greengrocer": ("traditionnel", "primeur"),
    "bakery": ("traditionnel", "boulangerie"),
    "butcher": ("traditionnel", "boucherie"),
    "seafood": ("traditionnel", "poissonnerie"),
    "chemist": ("traditionnel", "droguerie"),
    "general": ("traditionnel", "épicerie"),
    "kiosk": ("traditionnel", "épicerie"),
    "variety_store": ("traditionnel", "épicerie"),
    "wholesale": ("moderne", "hypermarché"),
    "discount": ("moderne", "hard_discount"),
}

# Enseignes connues au Maroc
KNOWN_ENSEIGNES = {
    "marjane": "Marjane",
    "carrefour": "Carrefour",
    "label'vie": "Label'Vie",
    "labelvie": "Label'Vie",
    "acima": "Acima",
    "bim": "BIM",
    "aswak": "Aswak Assalam",
    "atacadao": "Atacadão",
    "hanouty": "Hanouty",
    "electroplanet": "Electroplanet",
}

# =====================================================
# HELPER FUNCTIONS
# =====================================================

def detect_enseigne(name: str) -> Optional[str]:
    """Détecte l'enseigne à partir du nom"""
    if not name:
        return None
    name_lower = name.lower()
    for key, value in KNOWN_ENSEIGNES.items():
        if key in name_lower:
            return value
    return None

def calculate_confidence_score(source: DataSource, has_name: bool, has_address: bool, 
                              has_phone: bool, has_enseigne: bool) -> float:
    """Calcule le score de confiance"""
    base_scores = {
        DataSource.GOOGLE_PLACES: 85,
        DataSource.OPENSTREETMAP: 70,
        DataSource.COLLECTE_TERRAIN: 75,
        DataSource.IMPORT_CSV: 60,
        DataSource.IMPORT_JSON: 60,
        DataSource.AJOUT_MANUEL: 50,
        DataSource.NOMINATIM: 65,
    }
    score = base_scores.get(source, 50)
    if has_name: score += 5
    if has_address: score += 8
    if has_phone: score += 5
    if has_enseigne: score += 7
    return min(100.0, score)

def is_duplicate(new_pos: dict, threshold: float = 0.0005) -> bool:
    """Vérifie si un POS est un doublon"""
    for pos in DATABASE:
        if (abs(pos.get("latitude", 0) - new_pos.get("latitude", 0)) < threshold and
            abs(pos.get("longitude", 0) - new_pos.get("longitude", 0)) < threshold):
            return True
    return False

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en km entre deux points"""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def load_database():
    """Charge la base de données depuis le fichier JSON"""
    global DATABASE
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
                DATABASE = json.load(f)
            print(f"✅ Base de données chargée: {len(DATABASE)} POS")
        except Exception as e:
            print(f"❌ Erreur chargement: {e}")
            DATABASE = []
    else:
        DATABASE = []

def save_database():
    """Sauvegarde la base de données"""
    try:
        with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
            json.dump(DATABASE, f, ensure_ascii=False, indent=2, default=str)
        print(f"💾 Base sauvegardée: {len(DATABASE)} POS")
    except Exception as e:
        print(f"❌ Erreur sauvegarde: {e}")

# =====================================================
# OPENSTREETMAP COLLECTOR
# =====================================================

async def collect_from_osm(region_name: str, bbox: tuple) -> List[dict]:
    """Collecte les points de vente depuis OpenStreetMap pour une région"""
    south, west, north, east = bbox
    
    # Requête Overpass pour récupérer les commerces
    query = f"""
    [out:json][timeout:60];
    (
      node["shop"="supermarket"]({south},{west},{north},{east});
      node["shop"="convenience"]({south},{west},{north},{east});
      node["shop"="grocery"]({south},{west},{north},{east});
      node["shop"="greengrocer"]({south},{west},{north},{east});
      node["shop"="bakery"]({south},{west},{north},{east});
      node["shop"="butcher"]({south},{west},{north},{east});
      node["shop"="seafood"]({south},{west},{north},{east});
      node["shop"="general"]({south},{west},{north},{east});
      node["shop"="department_store"]({south},{west},{north},{east});
      node["shop"="mall"]({south},{west},{north},{east});
      node["amenity"="marketplace"]({south},{west},{north},{east});
    );
    out body;
    """
    
    results = []
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query}
            )
            response.raise_for_status()
            data = response.json()
            
            for element in data.get("elements", []):
                if element.get("lat") and element.get("lon"):
                    tags = element.get("tags", {})
                    
                    # Extraire le nom
                    name = tags.get("name", tags.get("name:fr", tags.get("name:ar", "")))
                    if not name:
                        name = f"Commerce OSM-{element.get('id', '')}"
                    
                    # Déterminer type et catégorie
                    shop_type = tags.get("shop", tags.get("amenity", "convenience"))
                    type_cat = OSM_CATEGORY_MAPPING.get(shop_type, ("traditionnel", "épicerie"))
                    
                    # Détecter l'enseigne
                    enseigne = detect_enseigne(name)
                    if enseigne in ["Marjane", "Carrefour", "Label'Vie", "Acima", "Atacadão"]:
                        type_cat = ("moderne", "hypermarché")
                    elif enseigne == "BIM":
                        type_cat = ("moderne", "hard_discount")
                    elif enseigne in ["Aswak Assalam", "Hanouty"]:
                        type_cat = ("moderne", "supermarché")
                    
                    # Construire l'adresse
                    addr_parts = []
                    if tags.get("addr:housenumber"):
                        addr_parts.append(tags.get("addr:housenumber"))
                    if tags.get("addr:street"):
                        addr_parts.append(tags.get("addr:street"))
                    address = ", ".join(addr_parts) if addr_parts else tags.get("addr:full", "")
                    
                    city = tags.get("addr:city", tags.get("addr:suburb", REGIONS_CONFIG.get(region_name, {}).get("main_city", "")))
                    
                    pos_data = {
                        "id": str(uuid.uuid4())[:12],
                        "nom": name,
                        "type": type_cat[0],
                        "categorie": type_cat[1],
                        "enseigne": enseigne,
                        "adresse": address or f"Coordonnées: {element.get('lat')}, {element.get('lon')}",
                        "ville": city,
                        "region": region_name,
                        "latitude": element.get("lat"),
                        "longitude": element.get("lon"),
                        "telephone": tags.get("phone", tags.get("contact:phone")),
                        "horaires": tags.get("opening_hours"),
                        "source": "openstreetmap",
                        "osm_id": str(element.get("id")),
                        "date_creation": datetime.now().isoformat(),
                        "date_mise_a_jour": datetime.now().isoformat(),
                        "actif": True,
                        "verifie": False,
                    }
                    
                    # Calculer le score
                    pos_data["score_confiance"] = calculate_confidence_score(
                        DataSource.OPENSTREETMAP,
                        bool(name and "Commerce" not in name),
                        bool(address),
                        bool(pos_data["telephone"]),
                        bool(enseigne)
                    )
                    
                    results.append(pos_data)
            
            print(f"  ✅ {region_name}: {len(results)} commerces trouvés")
            
    except Exception as e:
        print(f"  ❌ {region_name}: Erreur - {str(e)[:100]}")
    
    return results

# =====================================================
# FASTAPI APPLICATION
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie"""
    load_database()
    print("🚀 GeoRetail MVP démarré")
    yield
    save_database()
    print("💾 Base sauvegardée, arrêt")

app = FastAPI(
    title="GeoRetail MVP - Cartographie POS Maroc",
    description="""
## 🗺️ Plateforme de Cartographie des Points de Vente au Maroc

### Sources de Données
- **OpenStreetMap** - Données collaboratives mondiales (GRATUIT)
- **Nominatim** - Géocodage (GRATUIT)
- **Import Manuel** - CSV/JSON

### Fonctionnalités
- 📍 Gestion CRUD des points de vente
- 🌍 Collecte automatisée OSM
- 🔍 Recherche géographique
- 📊 Statistiques et analyses
- 📤 Export CSV/GeoJSON

*Projet de Fin d'Études - École Centrale Casablanca*
    """,
    version="3.0-Final",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ENDPOINTS
# =====================================================

@app.get("/", tags=["🏠 Accueil"])
async def root():
    """Page d'accueil"""
    return {
        "message": "🗺️ GeoRetail MVP - Cartographie POS Maroc",
        "version": "3.0-Final",
        "total_pos": len(DATABASE),
        "documentation": "/docs"
    }

# ----- GESTION DES POS -----

@app.get("/pos", tags=["📍 Points de Vente"])
async def get_all_pos(
    type: Optional[str] = None,
    region: Optional[str] = None,
    ville: Optional[str] = None,
    categorie: Optional[str] = None,
    enseigne: Optional[str] = None,
    source: Optional[str] = None,
    min_confidence: Optional[float] = Query(None, ge=0, le=100),
    limit: int = Query(1000, le=10000),
    offset: int = Query(0, ge=0)
):
    """Récupère tous les POS avec filtres"""
    results = DATABASE.copy()
    
    if type:
        results = [p for p in results if p.get("type") == type]
    if region:
        results = [p for p in results if region.lower() in p.get("region", "").lower()]
    if ville:
        results = [p for p in results if ville.lower() in p.get("ville", "").lower()]
    if categorie:
        results = [p for p in results if p.get("categorie") == categorie]
    if enseigne:
        results = [p for p in results if enseigne.lower() in (p.get("enseigne") or "").lower()]
    if source:
        results = [p for p in results if p.get("source") == source]
    if min_confidence:
        results = [p for p in results if p.get("score_confiance", 0) >= min_confidence]
    
    return results[offset:offset + limit]

@app.post("/pos", tags=["📍 Points de Vente"])
async def create_pos(pos_data: POSCreate):
    """Crée un nouveau POS"""
    pos = {
        "id": str(uuid.uuid4())[:12],
        **pos_data.dict(),
        "type": pos_data.type.value,
        "categorie": pos_data.categorie.value,
        "region": pos_data.region.value,
        "source": "ajout_manuel",
        "score_confiance": calculate_confidence_score(
            DataSource.AJOUT_MANUEL,
            bool(pos_data.nom),
            bool(pos_data.adresse),
            bool(pos_data.telephone),
            bool(pos_data.enseigne)
        ),
        "date_creation": datetime.now().isoformat(),
        "date_mise_a_jour": datetime.now().isoformat(),
        "actif": True,
        "verifie": False
    }
    
    if not is_duplicate(pos):
        DATABASE.append(pos)
        save_database()
        return pos
    else:
        raise HTTPException(status_code=409, detail="POS doublon détecté")

@app.get("/pos/{pos_id}", tags=["📍 Points de Vente"])
async def get_pos_by_id(pos_id: str):
    """Récupère un POS par ID"""
    for pos in DATABASE:
        if pos.get("id") == pos_id:
            return pos
    raise HTTPException(status_code=404, detail="POS non trouvé")

@app.delete("/pos/{pos_id}", tags=["📍 Points de Vente"])
async def delete_pos(pos_id: str):
    """Supprime un POS"""
    global DATABASE
    initial = len(DATABASE)
    DATABASE = [p for p in DATABASE if p.get("id") != pos_id]
    if len(DATABASE) < initial:
        save_database()
        return {"message": "POS supprimé", "id": pos_id}
    raise HTTPException(status_code=404, detail="POS non trouvé")

# ----- IMPORT -----

@app.post("/import/csv", tags=["📥 Import"])
async def import_csv(file: UploadFile = File(...)):
    """Importe des POS depuis CSV"""
    try:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        imported = 0
        for row in reader:
            try:
                lat = float(row.get('latitude', row.get('lat', 0)))
                lon = float(row.get('longitude', row.get('lon', 0)))
                if lat == 0 or lon == 0:
                    continue
                
                pos = {
                    "id": str(uuid.uuid4())[:12],
                    "nom": row.get("nom", row.get("name", "Commerce")),
                    "type": row.get("type", "traditionnel"),
                    "categorie": row.get("categorie", "épicerie"),
                    "enseigne": row.get("enseigne"),
                    "adresse": row.get("adresse", row.get("address", "")),
                    "ville": row.get("ville", row.get("city", "Inconnue")),
                    "region": row.get("region", "Casablanca-Settat"),
                    "latitude": lat,
                    "longitude": lon,
                    "telephone": row.get("telephone"),
                    "source": "import_csv",
                    "score_confiance": 60,
                    "date_creation": datetime.now().isoformat(),
                    "date_mise_a_jour": datetime.now().isoformat(),
                    "actif": True,
                    "verifie": False
                }
                
                if not is_duplicate(pos):
                    DATABASE.append(pos)
                    imported += 1
            except:
                continue
        
        save_database()
        return {"message": f"{imported} POS importés", "total": len(DATABASE)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/import/json", tags=["📥 Import"])
async def import_json(file: UploadFile = File(...)):
    """Importe des POS depuis JSON"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        if not isinstance(data, list):
            data = [data]
        
        imported = 0
        for item in data:
            if all(k in item for k in ['nom', 'latitude', 'longitude']):
                pos = {
                    "id": str(uuid.uuid4())[:12],
                    "nom": item.get("nom"),
                    "type": item.get("type", "traditionnel"),
                    "categorie": item.get("categorie", "épicerie"),
                    "enseigne": item.get("enseigne"),
                    "adresse": item.get("adresse", ""),
                    "ville": item.get("ville", "Inconnue"),
                    "region": item.get("region", "Casablanca-Settat"),
                    "latitude": item["latitude"],
                    "longitude": item["longitude"],
                    "telephone": item.get("telephone"),
                    "source": "import_json",
                    "score_confiance": 60,
                    "date_creation": datetime.now().isoformat(),
                    "date_mise_a_jour": datetime.now().isoformat(),
                    "actif": True,
                    "verifie": False
                }
                
                if not is_duplicate(pos):
                    DATABASE.append(pos)
                    imported += 1
        
        save_database()
        return {"message": f"{imported} POS importés", "total": len(DATABASE)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----- COLLECTE OSM -----

@app.post("/collect/osm", tags=["🌍 Collecte"])
async def start_osm_collection(
    regions: Optional[List[str]] = Query(None, description="Régions à collecter")
):
    """Lance la collecte OSM"""
    global COLLECT_STATUS
    
    if COLLECT_STATUS["is_running"]:
        return {"message": "Collecte déjà en cours", "status": COLLECT_STATUS}
    
    target_regions = regions or list(REGIONS_CONFIG.keys())
    
    COLLECT_STATUS = {
        "is_running": True,
        "last_run": datetime.now().isoformat(),
        "last_result": None,
        "progress": 0,
        "message": "Démarrage..."
    }
    
    total_collected = 0
    errors = []
    
    print("\n🌍 Démarrage de la collecte OpenStreetMap...")
    
    for i, region_name in enumerate(target_regions):
        if region_name not in REGIONS_CONFIG:
            continue
            
        COLLECT_STATUS["progress"] = int((i / len(target_regions)) * 100)
        COLLECT_STATUS["message"] = f"Collecte {region_name}..."
        
        config = REGIONS_CONFIG[region_name]
        
        try:
            results = await collect_from_osm(region_name, config["bbox"])
            
            added = 0
            for pos_data in results:
                if not is_duplicate(pos_data):
                    DATABASE.append(pos_data)
                    added += 1
            
            total_collected += added
            print(f"    → {added} nouveaux POS ajoutés")
            
        except Exception as e:
            error_msg = f"Erreur {region_name}: {str(e)[:50]}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")
        
        # Pause entre les régions
        await asyncio.sleep(2)
    
    save_database()
    
    COLLECT_STATUS = {
        "is_running": False,
        "last_run": datetime.now().isoformat(),
        "progress": 100,
        "message": f"Terminé: {total_collected} POS collectés",
        "last_result": {
            "total_collected": total_collected,
            "regions": target_regions,
            "errors": errors
        }
    }
    
    print(f"\n✅ Collecte terminée: {total_collected} nouveaux POS")
    
    return {
        "message": f"Collecte terminée: {total_collected} nouveaux POS",
        "collected": total_collected,
        "total_database": len(DATABASE),
        "errors": errors if errors else None
    }

@app.get("/collect/status", tags=["🌍 Collecte"])
async def get_collection_status():
    """Statut de la collecte"""
    return COLLECT_STATUS

# ----- RECHERCHE GÉOGRAPHIQUE -----

@app.get("/pos/search/nearby", tags=["🔍 Recherche"])
async def search_nearby(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(5, description="Rayon en km"),
    limit: int = Query(50, le=500)
):
    """Recherche les POS à proximité"""
    results = []
    for pos in DATABASE:
        dist = haversine_distance(lat, lon, pos.get("latitude", 0), pos.get("longitude", 0))
        if dist <= radius_km:
            results.append({**pos, "distance_km": round(dist, 2)})
    
    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]

@app.get("/pos/search/bbox", tags=["🔍 Recherche"])
async def search_bbox(
    min_lat: float = Query(...),
    min_lon: float = Query(...),
    max_lat: float = Query(...),
    max_lon: float = Query(...)
):
    """Recherche dans une bounding box"""
    return [
        pos for pos in DATABASE
        if (min_lat <= pos.get("latitude", 0) <= max_lat and
            min_lon <= pos.get("longitude", 0) <= max_lon)
    ]

# ----- STATISTIQUES -----

@app.get("/stats", tags=["📊 Statistiques"])
async def get_statistics():
    """Statistiques globales"""
    if not DATABASE:
        return {"total": 0}
    
    regions = {}
    villes = {}
    types = {"moderne": 0, "traditionnel": 0}
    sources = {}
    enseignes = {}
    categories = {}
    
    for pos in DATABASE:
        # Régions
        region = pos.get("region", "Inconnue")
        regions[region] = regions.get(region, 0) + 1
        
        # Villes
        ville = pos.get("ville", "Inconnue")
        villes[ville] = villes.get(ville, 0) + 1
        
        # Types
        t = pos.get("type", "traditionnel")
        if t in types:
            types[t] += 1
        
        # Sources
        src = pos.get("source", "inconnu")
        sources[src] = sources.get(src, 0) + 1
        
        # Enseignes
        ens = pos.get("enseigne")
        if ens:
            enseignes[ens] = enseignes.get(ens, 0) + 1
        
        # Catégories
        cat = pos.get("categorie", "autre")
        categories[cat] = categories.get(cat, 0) + 1
    
    return {
        "total": len(DATABASE),
        "par_type": types,
        "par_region": dict(sorted(regions.items(), key=lambda x: -x[1])),
        "par_ville": dict(sorted(villes.items(), key=lambda x: -x[1])[:20]),
        "par_source": sources,
        "par_enseigne": dict(sorted(enseignes.items(), key=lambda x: -x[1])),
        "par_categorie": categories,
        "derniere_mise_a_jour": max((p.get("date_mise_a_jour", "") for p in DATABASE), default=None)
    }

# ----- EXPORT -----

@app.get("/export/csv", tags=["📤 Export"])
async def export_csv():
    """Export CSV"""
    output = io.StringIO()
    if DATABASE:
        fieldnames = list(DATABASE[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(DATABASE)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=georetail_export.csv"}
    )

@app.get("/export/geojson", tags=["📤 Export"])
async def export_geojson():
    """Export GeoJSON"""
    features = []
    for pos in DATABASE:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [pos.get("longitude", 0), pos.get("latitude", 0)]
            },
            "properties": {k: v for k, v in pos.items() if k not in ["latitude", "longitude"]}
        })
    
    geojson = {"type": "FeatureCollection", "features": features}
    
    return StreamingResponse(
        iter([json.dumps(geojson, ensure_ascii=False, indent=2)]),
        media_type="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=georetail_export.geojson"}
    )

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
