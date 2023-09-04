import json

# pylint: disable=import-error
from fastapi import HTTPException

from shapely.geometry import shape, mapping
from shapely.ops import unary_union


class ExtractDataFile:
    """class qui contient les fonctions pour extraire l'emprise d'un fichier geo

    Raises:
        HTTPException: expetuion lever en cas d'erreur
        HTTPException: expetuion lever en cas d'erreur
        HTTPException: expetuion lever en cas d'erreur

    Returns:
        list: retourne une emprise
    """

    @staticmethod
    def extract_polygon_coordinates(geojson_data):
        """permet d'extraire les coordonnées d'un polygon dans un geojson en str

        Args:
            geojson_data (geojson): fichier geojson

        Raises:
            HTTPException: renvoie une erreur si lors de l'extraction de l'emprise il y'a une erreur

        Returns:
            dict: renvoie les coordoonnées de l'emprise sous cette forme [[x1, y1], [x2,y2]]
        """
        try:
            geojson = json.loads(geojson_data)
            features = geojson.get("features", [])

            polygons = [
                shape(feature.get("geometry"))
                for feature in features
                if feature.get("geometry").get("type") == "Polygon"
            ]

            if not polygons:
                raise HTTPException(
                    status_code=400,
                    detail="Aucun polygone valide trouvé dans le GeoJSON",
                )

            multyPolygon = unary_union(polygons)
            multyPolygon_geojson = {json.dumps(mapping(multyPolygon))}
            return multyPolygon_geojson

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail="Erreur lors de la récupération de l'emprise des polygones",
            ) from e
