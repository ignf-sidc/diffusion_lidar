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
        """Permet d'extraire les coordonnées d'un polygon ou d'un multipolygon dans un GeoJSON en str.

        Args:
            geojson_data (str): Fichier GeoJSON au format string.

        Raises:
            HTTPException: Renvoie une erreur si la géométrie n'est ni un polygon ni un multipolygon.
            HTTPException: Renvoie une erreur si une erreur se produit lors de l'extraction des coordonnées.

        Returns:
            dict: Renvoie les coordonnées du polygon ou du multipolygon sous forme de liste de listes.
        """
        try:
            # Charge le GeoJSON depuis la chaîne JSON en un dict
            geojson = json.loads(geojson_data)
            # Récupére la liste des "features" du GeoJSON
            features = geojson.get("features", [])

            # Initialise des listes vides pour les polygons et les multipolygons
            polygons = []
            multipolygons = []

            for feature in features:
                # Obtiens le type de géométrie
                geometry_type = feature.get("geometry").get("type")

                if geometry_type == "Polygon":
                    # Si c'est un Polygon, convertir la géométrie en objet Shapely
                    polygons = [
                        shape(feature.get("geometry"))
                        for feature in features
                        if feature.get("geometry").get("type") == "Polygon"
                    ]
                elif geometry_type == "MultiPolygon":
                    # Si c'est un MultiPolygon, convertir la géométrie en objet Shapely MultiPolygon
                    multipolygons.append(shape(feature.get("geometry")))
                else:
                    # Si la géométrie n'est ni un Polygon ni un MultiPolygon, lever une exception
                    raise HTTPException(
                        status_code=400,
                        detail="La géométrie n'est ni un Polygon ni un MultiPolygon",
                    )

            # Vérifie s'il existe des polygones ou des multipolygones valides
            if not polygons and not multipolygons:
                raise HTTPException(
                    status_code=400,
                    detail="Aucun polygon ou multipolygon valide trouvé dans le GeoJSON",
                )

            if multipolygons:
                # Si des multipolygons sont présents, les fusionner en un seul multipolygon
                merged_multipolygon = unary_union(multipolygons)
                print(json.dumps(mapping(merged_multipolygon)))
                return json.dumps(mapping(merged_multipolygon))

            if polygons:
                # Si des polygones sont présents, les fusionner en un seul polygon
                polygons = unary_union(polygons)
                return json.dumps(mapping(polygons))

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail="Erreur lors de l'extraction des coordonnées des polygones",
            ) from e

    @staticmethod
    def limite_emprise(emprise, km_max):
        """permet de savoir si une emprise depasse ou non 2500km carré

        Args:
            emprise (str): str qui contient un dictionnaire avec soit un polygon, soit un multipolygon
            km (int): nombre de km max pour l'emprise

        Returns:
            float/boolean: retorune false si la limite est dépasser sinon renvoie le nombre de km
        """
        # Convertir les coordonnées JSON en un objet MultiPolygon
        multipolygon = shape(json.loads(emprise))
        # obtenir la superficie en mètres carrés
        area_meters_squared = multipolygon.area
        # Convertir la superficie en kilomètres carrés en divisant par 1 000 000
        area_km_squared = area_meters_squared / 1e6
        print(f"Superficie en kilomètres carrés : {area_km_squared} km²")
        # si le nombre de km carré est plus que la limite km on renvoie False
        if area_km_squared < km_max:
            return area_km_squared
        return False
