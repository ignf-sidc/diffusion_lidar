from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.app.adapters.dalle_lidar_classe import get_blocs_classe

router = APIRouter(
    prefix="/data",
    tags=["affichage des données"],
    responses={404: {"description": "Not found"}},
)


@router.get("/get/blocs")
def get_blocs():
    """route qui retourne les blocs disponibles

    Returns:
        JSONResponse: result -> le nom des blocs et leurs coordonnées, count_bloc -> le nombre de bloc
    """
    blocs = get_blocs_classe()
    return JSONResponse(content={"result": blocs, "count_bloc": len(blocs["features"])})
