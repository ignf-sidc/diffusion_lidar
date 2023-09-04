import io
import json

# pylint: disable=import-error
from fastapi.testclient import TestClient
from api.app.main import app


client = TestClient(app)


def test_upload_file_geojson_success():
    """test si la route qui upload le geojson renvoie bien son emprise"""
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 0]]],
                },
            }
        ],
    }
    geojson_bytes = io.BytesIO(json.dumps(geojson_data).encode())
    response = client.post(
        "/upload/geojson",
        files={"file": ("test.geojson", geojson_bytes, "application/json")},
    )
    assert response.status_code == 200
    assert response.json() == {
        "polygon": [
            '{"type": "Polygon", "coordinates": [[[0.0, 0.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]]}'
        ]
    }


def test_upload_geojson_invalid_geometry_type():
    """test si la route qui upload le geojson renvoie une erreur si s'est un point"""
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}}
        ],
    }
    response = client.post(
        "/upload/geojson", files={"file": ("data.geojson", json.dumps(geojson_data))}
    )
    assert response.status_code == 500


def test_upload_txt_file():
    """test si la route upload un fichier autre que geojson, alors ça renvoie une erreur"""
    txt_data = "txt"
    response = client.post("/upload/geojson", files={"file": ("data.txt", txt_data)})
    # pylint: disable=unexpected-line-ending-format
    # pylint: disable=missing-final-newline
    assert response.status_code == 500
