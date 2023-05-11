# pylint: disable=import-error
from fastapi import FastAPI
# pylint: disable=import-error
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

origins = [
    f"http://{ os.environ.get('HOST')}:3000",
    f"{ os.environ.get('HOST')}:3000",
    "http://frontend:3000",
    "frontend:3000"
]

tags_metadata = [{"name": "hello_world", "description": "route test"}]

app = FastAPI(
    title="API pour l'interface diffusion lidar",
    description="description à completer",
    version="0.0.1",
    openapi_tags=tags_metadata,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
    




@app.get("/hello_world")
def hello_world():
    """route test

    Returns:
        dict: retourne un message test
    """
    return {"hello": "world"}
