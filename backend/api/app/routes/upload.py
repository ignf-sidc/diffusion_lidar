from fastapi import APIRouter, File, UploadFile, HTTPException
from api.app.adapters.ExtractDataFile import ExtractDataFile

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
    responses={404: {"description": "Not found"}},
)


@router.post("/geojson")
async def upload_file_geojson(file: UploadFile = File(...)):
    """route qui prend en entré un geojson et qui renvoie l'emprise de ce geojson

    Args:
        file (UploadFile): geojson qui contient un polygon. Defaults to File(...).

    Raises:
        HTTPException: renvoie une erreur si lors de l'extraction de l'emprise il y'a une erreur

    Returns:
        dict: renvoie les coordoonnées de l'emprise sous cette forme [[x1, y1], [x2,y2]]
    """
    try:
        # Traitez le fichier GeoJSON pour extraire les coordonnées du polygone
        geojson_data = await file.read()
        polygon_coordinates = ExtractDataFile.extract_polygon_coordinates(geojson_data)
        return {"polygon": polygon_coordinates}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Erreur lors du traitement du fichier"
        ) from e
