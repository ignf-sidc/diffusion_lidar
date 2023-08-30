# pylint: disable=import-error
from fastapi import FastAPI, File, UploadFile, HTTPException

# pylint: disable=import-error
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.app.ExtractDataFile import ExtractDataFile


load_dotenv()


# origins = [
#     f"http://{ os.environ.get('REACT_APP_HOST_API')}:3000",
#     f"https://{ os.environ.get('REACT_APP_HOST_API')}:3000",
#     f"{ os.environ.get('REACT_APP_HOST_API')}:3000",
#     "http://frontend:3000",
#     "https://frontend:3000",
#     "frontend:3000",
# ]

tags_metadata = [{"name": "hello_world", "description": "route test"}]
UPLOAD_FOLDER = "uploads"

app = FastAPI(
    title="API pour l'interface diffusion lidar",
    description="description à completer",
    version="0.0.1",
    openapi_tags=tags_metadata,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/hello_world")
def hello_world():
    """route test

    Returns:
        dict: retourne un message test
    """
    return {"hello": "world"}


@app.post("/upload/geojson")
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
        return {"polygon_coordinates": polygon_coordinates}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Erreur lors du traitement du fichier"
        ) from e
