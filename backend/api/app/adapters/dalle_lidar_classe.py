import os
import json
import urllib.request
import shapely.geometry
from shapely.wkb import loads
import requests
from bs4 import BeautifulSoup
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from shapely import area, to_geojson

# bloc disponible sur https://lidar-publications.cegedim.cloud/, à modifier pour le rendre dynamique
BLOCS = []

html_content = requests.get(
    "https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/"
).text
soup = BeautifulSoup(html_content, "lxml")

for link in soup.find_all("a"):
    if link.text != "test/":
        BLOCS.append(link.text.split("/")[0])

# html_content = requests.get("https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/").text
# soup = BeautifulSoup(html_content, "lxml")

# for link in soup.find_all("a"):
#     if link.text != "test/":
#         BLOCS.append(link.text.split("/")[0])


def get_connexion_bdd():
    """Connexion à la base de données pour accéder aux dalles pcrs

    Returns:
        cursor: curseur pour executer des requetes à la base
    """
    try:
        load_dotenv()

        conn = psycopg2.connect(
            database=os.environ.get("PGDATABASE"),
            user=os.environ.get("PGUSER"),
            host=os.environ.get("PGHOST"),
            password=os.environ.get("PGPASSWORD"),
            port=os.environ.get("PGPORT"),
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except psycopg2.OperationalError as e:
        return False
    return cur


def get_dalle_classe():
    """recupere les dalles classées

    Returns:
        dict: retourne tous les paquets lidar classé avec leur code
    """
    # on recupere le chemin du geojson
    script_dir = os.path.dirname(__file__)
    file_path_config = os.path.join(script_dir, "../static/json/lidar_classe.geojson")
    # variable dans laquel sera stocker le geojson
    data = []
    try:
        with open(file_path_config) as json_file:
            data = json.load(json_file)
    except:
        print("erreur dans la récuperation du geojson lidar_classe.geojson")
    # les paquets qui seront envoyés par l'api
    paquets = {}
    for bloc in data["features"]:
        # print(bloc["properties"]["Avancement"])
        nom_bloc = bloc["properties"]["Nom_bloc"]
        # si le nom du bloc n'est pas en key dans le dict alors qu'on creer la key qui contiendra tous les paquets du code actuel -> list
        if nom_bloc not in paquets:
            paquets[nom_bloc] = []

        # if bloc["properties"]["Avancement"] == "Donnée brute diffusée":
        if nom_bloc in BLOCS:
            # on recupere les paquets par code
            data = urllib.request.urlopen(
                f"https://lidar-publications.cegedim.cloud/{nom_bloc}.txt"
            )
            # on parcours chaque ligne pour inserer chaque paquets dans le code concerné
            for line in data:
                # on decode les lignne : bytes -> string
                paquets[nom_bloc].append(line.decode("utf-8").split("\n")[0])

    return paquets


def get_blocs_classe():
    """Recupere les blocs disponible dans le geojson -> lidar_classe.geojson

    Returns:
        List: Listes des blocs disponible
    """
    bdd = get_connexion_bdd()
    blocs_geojson = {"features": []}
    if bdd:
        bdd.execute("SELECT * FROM bloc")
        blocs = bdd.fetchall()
        for bloc in blocs:
            blocs_geojson["features"].append(
                {
                    "type": "Feature",
                    "properties": {
                        "Nom_bloc": bloc["name"],
                        "Superficie": int(area(loads(bloc["geom"])) / 1000000),
                    },
                    "geometry": json.loads(to_geojson(loads(bloc["geom"]))),
                }
            )
    return blocs_geojson


def get_dalle_in_bloc():
    """Recupere les dalles dans les blocs (on enleve ceux qui dépasse)

    Returns:
        dict: Dalles dans les blocs + nombre de dalle en tout
    """
    # on recupere tous les blocs et toutes les classes
    paquets = get_dalle_classe()
    blocs = get_blocs_classe()
    script_dir = os.path.dirname(__file__)
    file_path_json = os.path.join(
        script_dir, "../static/json/dalle_lidar_classe.geojson"
    )
    # taille des dalles
    size = 1000
    # dict qui contiendra les dalles qui sont dans le bloc
    paquet_within_bloc = {}
    count_dalle = 0
    # on balaye tous les paquets et blocs
    for paquet in paquets:
        for bloc in blocs:
            name_bloc = bloc["properties"]["Nom_bloc"]
            # si le paquet appartient au bloc
            if name_bloc == paquet:
                # on recupere toutes les dalles du bloc
                dalles = paquets[paquet]
                # on balaye les dalles
                for dalle in dalles:
                    # on recupere le x_min, y_min, x_max, y_max pour former une bbox
                    split_dalle = dalle.split("_")
                    x_min = int(split_dalle[2]) * 1000
                    y_max = int(split_dalle[3]) * 1000
                    x_max = x_min + size
                    y_min = y_max - size
                    # si la clé du bloc n'est pas le dictionnaire alors on le creer
                    if name_bloc not in paquet_within_bloc:
                        paquet_within_bloc[name_bloc] = []

                    bbox = (x_min, y_min, x_max, y_max)
                    # si la dalle est dans le bloc alors on la garde, on enleve les dalles qui dépassent du bloc
                    if bbox_in_geojson(bbox, bloc["geometry"]):
                        paquet_within_bloc[name_bloc].append(
                            {"name": dalle, "bbox": bbox}
                        )
                    count_dalle += 1

    json_content = {
        "count_dalle": count_dalle,
        "paquet_within_bloc": paquet_within_bloc,
    }
    with open(file_path_json, "w") as f:
        json.dump(json_content, f)


def get_bboxes_within_multipolygon(bbox, multipolygon):
    """Recupere les dalles contenu dans une geometry avec un recouvrement de 100%

    Args:
        bbox (tuple): bbox -> (x_min, y_min, x_max, y_max)
        multipolygon (geojson): peu aussi être un polygon

    Returns:
        bool: on retourne True si la bbbox est dans le polygon
    """
    # on transforme notre polygon en geometry
    multipolygon_shape = shapely.geometry.shape(multipolygon)
    # on transforme notre bbox en geometry
    bbox_polygon = shapely.geometry.box(*bbox)
    # on regarde si la bbox est dans le polygon
    if multipolygon_shape.contains(bbox_polygon):
        return True
    return False


def bbox_in_geojson(bbox, geojson):
    """Recupere les dalles contenu dans une geometry même avec si le recouvrement n'est pas de 100%

    Args:
        bbox (tuple): bbox -> (x_min, y_min, x_max, y_max)
        multipolygon (geojson): peu aussi être un polygon

    Returns:
        bool: on retourne True si la bbbox est dans le polygon
    """
    bbox_poly = shapely.geometry.box(*bbox)
    geojson_poly = shapely.geometry.shape(geojson)
    # calcule l'aire de l'intersection entre la bbox et la géométrie GeoJSON
    intersection_area = bbox_poly.intersection(geojson_poly).area
    # si il y'a un recouvrement d'au moins 1%
    if intersection_area >= 0.01:
        return True
