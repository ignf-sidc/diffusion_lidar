import json

# pylint: disable=import-error
from fastapi import HTTPException


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
            geometry_type = geojson["features"][0]["geometry"]["type"]
            polygon_coordinates = geojson["features"][0]["geometry"]["coordinates"][0]

            if geometry_type != "Polygon":
                raise HTTPException(
                    status_code=400, detail="Le type de géométrie doit être un polygon"
                )

            # Vérifie si les coordonnées sont valides
            if not all(
                isinstance(coord, list) and len(coord) == 2
                for coord in polygon_coordinates
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Les coordonnées du polygone sont incorrectes",
                )

            return polygon_coordinates
        except Exception as e:
            # pylint: disable=unexpected-line-ending-format
            # pylint: disable=missing-final-newline
            raise HTTPException(
                status_code=500,
                detail="Erreur lors de l'extraction des coordonnées du polygon",
            ) from e
