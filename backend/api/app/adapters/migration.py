"""Module de remplissage de la BDD à partir du S3."""

from __future__ import annotations


import os
import json
from typing import Any, Optional
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import Error
from tqdm import tqdm
import boto3
from botocore.exceptions import ClientError
from shapely.geometry import shape, MultiPolygon, Polygon  # type:ignore
from shapely import area  # type:ignore
from shapely.ops import unary_union  # type:ignore
from shapely.wkt import dumps  # type:ignore


class Database:
    """Classe de gestion de de la BDD."""

    def __init__(self) -> None:
        self.script_dir = os.path.dirname(__file__)
        self.tables = ["dalle", "bloc"]
        self.conn: Optional[psycopg2.Connection[tuple[Any, ...]]]
        self.cursor: Optional[psycopg2.Cursor[tuple[Any, ...]]]

    def connection(self):
        """Initialise la connexion à la base."""
        load_dotenv()
        # informations de connexion à la base de données
        host = os.environ.get("PGHOST")
        database = os.environ.get("PGDATABASE")
        user = os.environ.get("PGUSER")
        password = os.environ.get("PGPASSWORD")
        port = os.environ.get("PGPORT")
        # connexion à la base de données
        try:
            self.conn = psycopg2.connect(
                user=user, password=password, host=host, database=database, port=port
            )
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        except (Exception, Error) as error:
            print("Erreur lors de la connexion à la base de données :", error)

    def init_database(self):
        """Fonction pour initialiser la BDD."""
        self.cursor.execute("""CREATE EXTENSION IF NOT EXISTS postgis;""")
        self.cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS bloc (
                id serial PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                geom geometry NOT NULL
            );
            """
        )
        self.cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS dalle (
                id serial PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                geom geometry NOT NULL,
                bloc_id INTEGER NOT NULL,
                FOREIGN KEY (bloc_id) REFERENCES bloc(id)
            );
            """
        )
        self.conn.commit()

    def close_connection(self):
        """Fonction de fermeture propre de la connexion à la BDD."""
        # fermeture de la connexion à la base de données
        if self.conn:
            self.cursor.close()
            self.conn.close()
            print("Connexion à la base de données fermée")

    def list_blocs(self) -> list[dict[str, Any]]:
        """Liste les blocs déjà en base.

        Returns:
            list[dict[str,Any]]: liste des blocs [{id: <int>, name: <str>}]
        """
        assert self.cursor is not None
        self.cursor.execute("SELECT id, name FROM bloc;")
        return [dict(x) for x in self.cursor.fetchall()]

    def insert(
        self, bloc_name: str, bloc_geom: str, dalles: list[dict[str, Any]]
    ) -> None:
        """Insère un bloc et ses dalles en base.

        Args:
            bloc_name (str): nom du bloc
            bloc_geom (str): géométrie du bloc en binaire
            dalles (list[dict[str, Any]]): liste des dalles
        """
        assert self.cursor and self.conn
        self.cursor.execute(
            f"INSERT INTO bloc(name, geom) VALUES ('{bloc_name}', '{bloc_geom}') RETURNING id;"
        )
        result = dict(self.cursor.fetchone())
        for dalle in dalles:
            self.cursor.execute(
                f"INSERT INTO dalle(name, geom, bloc_id) VALUES ('{dalle['name']}', ST_GeomFromText('{dumps(dalle['geom'])}'), {result['id']});"
            )
        self.conn.commit()


class BucketAdapter:
    """Classe de gestion du S3."""

    def __init__(self) -> None:
        """Initialise la connexion au S3."""
        load_dotenv()
        session = boto3.session.Session()
        self.s3_client = session.client(
            service_name="s3",
            aws_access_key_id=os.environ.get("ACCESS_KEY"),
            aws_secret_access_key=os.environ.get("SECRET_KEY"),
            endpoint_url=os.environ.get("ENDPOINT"),
            region_name=os.environ.get("REGION"),
        )
        self.bucket_name: str = str(os.environ.get("BUCKET", 'BUCKET_NOT_DEF'))
        self.link_download: str = "https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar"

    def list_blocs(self) -> list[str]:
        """Liste les blocs sur le S3.

        Returns:
            list[str]: liste des blocs
        """
        blocs = []
        result = self.s3_client.list_objects(
            Bucket=self.bucket_name, Prefix="", Delimiter="/"
        )
        if result:
            for o in result.get("CommonPrefixes"):
                blocs.append(o.get("Prefix").replace("/", ""))
        return blocs

    def get_dalles(self, bloc: str) -> list[dict[str, Any]]:
        """Liste les dalles d'un bloc sur le S3.

        Returns:
            list[dict[str, any]]: liste des dalles [{name: <str>, geom: Polygon}]
        """
        # On ouvre le fichier JSON
        response = self.s3_client.get_object(
            Bucket=self.bucket_name, Key=f"{bloc}/index.json"
        )
        bloc_data = json.loads(response["Body"].read().decode("utf-8"))
        dalles: list[dict[str, Any]] = []
        for feature in bloc_data["features"]:
            dalle: dict[str, Any] = {
                "name": f"{self.link_download}/{bloc}/{feature['properties']['file']}",
                "geom": shape(feature["geometry"]),
            }
            dalles.append(dalle)
        return dalles


class LoadData:
    """Classe de gestion des deux autres classes."""

    def __init__(self) -> None:
        self.database = Database()
        self.bucket_adapter = BucketAdapter()
        self.todo_blocs: list[str] = []

    def list_todo(self) -> None:
        self.database.connection()
        self.database.init_database()
        """On liste les blocs à traiter."""
        db_blocs = sorted([b["name"] for b in self.database.list_blocs()])
        print(f'{len(db_blocs)} blocs en base : {", ".join(db_blocs)}')
        s3_blocs = sorted(self.bucket_adapter.list_blocs())
        print(f'{len(s3_blocs)} blocs en ligne : {", ".join(s3_blocs)}')
        # Blocs à traiter
        self.todo_blocs = sorted(list(set(s3_blocs) - set(db_blocs)))
        print(f'{len(self.todo_blocs)} blocs à ajouter : {", ".join(self.todo_blocs)}')
        self.database.close_connection()

    def process_blocs(self) -> None:
        """On traite chaque bloc."""
        # Traitement des blocs
        for bloc in tqdm(self.todo_blocs):
            self.process_bloc(bloc)
        print("\nTous les blocs ont été traités.")

    def process_bloc(self, bloc: str) -> None:
        """On traite un bloc.

        Args:
            bloc (str): bloc à traiter
        """
        tqdm.write(f'\nTraitement de {bloc}...')

        try:

            self.database.connection()
            self.database.init_database()
            # Listing des dalles
            dalles = self.bucket_adapter.get_dalles(bloc)
            # Calcul de la geom du bloc
            polygon = unary_union([dalle["geom"] for dalle in dalles])
            if isinstance(polygon, Polygon):
                polygon = MultiPolygon([polygon])
            # pour chaque polygone (du multi), on ne va récupérer que l'exterior ring et normaliser
            multi_polygon = MultiPolygon(
                [Polygon(polygon.exterior.coords).normalize() for polygon in polygon.geoms]
            )
            geom = dumps(multi_polygon)
            tqdm.write(f' * {bloc} : {len(dalles)} dalles pour {int(area(multi_polygon)/1000000)} km².')
            # Insertion blocs + dalles
            self.database.insert(bloc, geom, dalles)
            tqdm.write(f' * {bloc} : terminé')
            self.database.close_connection()
        except ClientError:
            tqdm.write(f" * {bloc} : fichier d'index introuvable. La livraison doit être en cours...")


if __name__ == "__main__":
    load_data = LoadData()
    load_data.list_todo()
    load_data.process_blocs()
