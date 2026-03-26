from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import httpx
import logging

router = APIRouter(prefix="/api/sports", tags=["sports"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[Dict[str, Any]])
async def get_nearby_sports_facilities(
    lat: float = Query(..., description="Latitude of user location"),
    lon: float = Query(..., description="Longitude of user location"),
    radius: int = Query(3000, ge=100, le=50000, description="Search radius in meters (100-50000)")
):
    """
    Fetch nearby sports facilities (gyms, stadiums, courts) using OpenStreetMap Overpass API.
    """
    try:
        # Build Overpass QL query for various sports facilities
        query = f"""
        [out:json][timeout:25];
        (
          nwr(around:{radius},{lat},{lon})["leisure"="sports_centre"];
          nwr(around:{radius},{lat},{lon})["leisure"="stadium"];
          nwr(around:{radius},{lat},{lon})["leisure"="pitch"];
          nwr(around:{radius},{lat},{lon})["amenity"="gym"];
          nwr(around:{radius},{lat},{lon})["sport"];
        );
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
            
        # Process results to extract sports facility info
        facilities = []
        elements = data.get("elements", [])
        
        for elem in elements:
            tags = elem.get("tags", {})
            sport_type = tags.get("sport", tags.get("leisure", "sports"))
            
            # Skip if it's not a relevant sports facility
            if not any(key in tags for key in ["leisure", "sport", "amenity"]):
                continue
                
            facility_info = {
                "id": elem.get("id"),
                "name": tags.get("name", "Unnamed Sports Facility"),
                "lat": None,
                "lon": None,
                "address": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip(),
                "phone": tags.get("phone"),
                "sport": sport_type,
                "leisure_type": tags.get("leisure"),
                "opening_hours": tags.get("opening_hours"),
                "website": tags.get("website"),
                "type": "sports"
            }
            
            if elem.get("type") == "node":
                facility_info["lat"] = elem.get("lat")
                facility_info["lon"] = elem.get("lon")
            elif elem.get("type") in ["way", "relation"]:
                bounds = elem.get("bounds")
                if bounds:
                    facility_info["lat"] = (bounds["minlat"] + bounds["maxlat"]) / 2
                    facility_info["lon"] = (bounds["minlon"] + bounds["maxlon"]) / 2
            
            # Only add if we have valid coordinates
            if facility_info["lat"] is not None and facility_info["lon"] is not None:
                facilities.append(facility_info)
        
        logger.info(f"Found {len(facilities)} sports facilities near ({lat}, {lon})")
        return facilities
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Overpass API error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch data from OpenStreetMap")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")