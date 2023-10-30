from fastapi import APIRouter, File, UploadFile, HTTPException
from api.app.adapters.ExtractDataFile import ExtractDataFile

router = APIRouter()


@router.post("api/geojson")
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
        limite_emprise_not_surpass = ExtractDataFile.limite_emprise(
            polygon_coordinates, 2500
        )
        # on regarde si l'emprise fait plus de 2500 km carré
        if limite_emprise_not_surpass:
            return {
                "polygon": polygon_coordinates,
                "message": f"succés du téléchargement. Superficie : {round(limite_emprise_not_surpass,2)} km²",
                "statut": "success",
            }
        return {
            "polygon": False,
            "message": f"erreur, L'emprise fais plus de 2500km",
            "statut": "error",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Erreur lors du traitement du fichier"
        ) from e
