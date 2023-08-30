# pylint: disable=import-error
from fastapi import FastAPI

# pylint: disable=import-error
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.app.routes import test, upload

load_dotenv()

tags_metadata = [{"name": "hello_world", "description": "route test"}]

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

app.include_router(test.router)
app.include_router(upload.router)
