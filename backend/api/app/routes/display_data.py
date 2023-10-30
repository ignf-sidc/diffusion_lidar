from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.app.adapters.dalle_lidar_classe import get_blocs_classe, get_connexion_bdd
from dotenv import load_dotenv

router = APIRouter()


@router.get("api/get/blocs")
def get_blocs():
    """route qui retourne les blocs disponibles

    Returns:
        JSONResponse: result -> le nom des blocs et leurs coordonnées, count_bloc -> le nombre de bloc
    """
    blocs = get_blocs_classe()
    return JSONResponse(content={"result": blocs, "count_bloc": len(blocs["features"])})


@router.get("api/get/dalles/{x_min}/{y_min}/{x_max}/{y_max}")
def get_dalle_lidar_classe_2(
    x_min: float = None, y_min: float = None, x_max: float = None, y_max: float = None
):
    load_dotenv()
    bdd = get_connexion_bdd()
    # si il n'y a aucun probleme avec la connexion à la base
    if bdd:
        #  on recupere les dalles qui sont dans la bbox envoyer
        bdd.execute(
            f"SELECT name, ST_AsGeoJson(geom) as polygon FROM dalle WHERE geom && ST_MakeEnvelope({x_min}, {y_min}, {x_max}, {y_max})"
        )
        dalles = bdd.fetchall()
        bdd.execute(f"SELECT count(id) FROM dalle")
        count_dalle = bdd.fetchone()
        statut = "success"
        bdd.close()
    else:
        statut = "erreur"
    return JSONResponse(
        content={
            "statut": statut,
            "result": dalles,
            "count_dalle": count_dalle["count"],
        }
    )
