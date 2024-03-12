# pylint: disable=import-error
from fastapi.testclient import TestClient

# pylint: disable=import-error
from fastapi import HTTPException
from api.app.main import app
from api.app.adapters.ExtractDataFile import ExtractDataFile
import pytest

client = TestClient(app)


def test_extract_polygon_coordinates_valid():
    """test si la fonction extract_polygon_coordinates renvoie la bonne emprise par rapport au geojson fournit"""
    geojson_data = '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 0]]]}}]}'
    result = ExtractDataFile.extract_polygon_coordinates(geojson_data)
    assert (
        result
        == '{"type": "Polygon", "coordinates": [[[0.0, 0.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]]}'
    )


def test_extract_polygon_coordinates_missing_data():
    """test si la fonction extract_polygon_coordinates renvoie une exception si le geojson est vide"""
    geojson_data = '{"type": "FeatureCollection", "features": []}'
    with pytest.raises(HTTPException):
        ExtractDataFile.extract_polygon_coordinates(geojson_data)


def test_extract_polygon_coordinates_invalid_geojson():
    """test si la fonction extract_polygon_coordinates renvoie une exception si le geojson est invalide"""
    geojson_data = '{"invalid_key": "invalid_value"}'
    with pytest.raises(HTTPException):
        ExtractDataFile.extract_polygon_coordinates(geojson_data)


def test_extract_polygon_coordinates_wrong_geometry_type():
    """test si la fonction extract_polygon_coordinates renvoie une exception si le geojson n'a pas la bonne géometry"""
    geojson_data = '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}}]}'
    with pytest.raises(HTTPException):
        ExtractDataFile.extract_polygon_coordinates(geojson_data)


def test_extract_polygon_coordinates_internal_error_coor():
    """test si la fonction extract_polygon_coordinates renvoie une exception si le geojson n'a que des x comme coordonnées"""
    geojson_data = '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[0], [1], [1], [0]]]}}]}'
    with pytest.raises(HTTPException):
        ExtractDataFile.extract_polygon_coordinates(geojson_data)


def test_emprise_inferieure_limite():
    """test si l'emprise du polygon ou multipolygon fait moins de 2500km carré"""
    emprise = (
        '{"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}'
    )
    km_max = 2500
    resultat = ExtractDataFile.limite_emprise(emprise, km_max)
    assert resultat == 0.000001


def test_emprise_superieure_limite():
    """test si l'emprise du polygon ou multipolygon fait plus de 2500km carré"""
    emprise = '{"type": "Polygon", "coordinates": [[[0, 0], [0, 100000], [100000, 100000], [100000, 0], [0, 0]]]}'
    km_max = 2500
    resultat = ExtractDataFile.limite_emprise(emprise, km_max)
    # pylint: disable=unexpected-line-ending-format
    # pylint: disable=missing-final-newline
    assert not resultat
