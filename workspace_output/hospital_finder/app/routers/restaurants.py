from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import httpx
import logging

router = APIRouter(prefix="/api/restaurants", tags=["restaurants"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[Dict[str, Any]])
async def get_nearby_restaurants(
    lat: float = Query(..., description="Latitude of user location"),
    lon: float = Query(..., description="Longitude of user location"),
    radius: int = Query(3000, ge=100, le=50000, description="Search radius in meters (100-50000)")
):
    """
    Fetch nearby restaurants using OpenStreetMap Overpass API.
    """
    try:
        # Build Overpass QL query for restaurants and food establishments
        query = f"""
        [out:json][timeout:25];
        nwr(around:{radius},{lat},{lon})["amenity"="restaurant"];
        out body;
        >;
        out skel qt;
        """
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query}
            )
            response.raise_for_status()
            data = response.json()
            
        # Process results to extract restaurant info
        restaurants = []
        elements = data.get("elements", [])
        
        for elem in elements:
            if elem.get("type") == "node":
                tags = elem.get("tags", {})
                restaurants.append({
                    "id": elem.get("id"),
                    "name": tags.get("name", "Unnamed Restaurant"),
                    "lat": elem.get("lat"),
                    "lon": elem.get("lon"),
                    "address": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip(),
                    "phone": tags.get("phone"),
                    "cuisine": tags.get("cuisine"),
                    "opening_hours": tags.get("opening_hours"),
                    "website": tags.get("website"),
                    "type": "restaurant"
                })
            elif elem.get("type") in ["way", "relation"]:
                # For ways/relations, we need center coordinates - simplified approach
                tags = elem.get("tags", {})
                # Try to get center from bounds if available
                bounds = elem.get("bounds")
                if bounds:
                    center_lat = (bounds["minlat"] + bounds["maxlat"]) / 2
                    center_lon = (bounds["minlon"] + bounds["maxlon"]) / 2
                    restaurants.append({
                        "id": elem.get("id"),
                        "name": tags.get("name", "Unnamed Restaurant"),
                        "lat": center_lat,
                        "lon": center_lon,
                        "address": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip(),
                        "phone": tags.get("phone"),
                        "cuisine": tags.get("cuisine"),
                        "opening_hours": tags.get("opening_hours"),
                        "website": tags.get("website"),
                        "type": "restaurant"
                    })
        
        logger.info(f"Found {len(restaurants)} restaurants near ({lat}, {lon})")
        return restaurants
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Overpass API error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch data from OpenStreetMap")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")