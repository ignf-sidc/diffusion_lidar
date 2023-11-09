# Interface de diffusion de donnée lidar

## Installation 

Avant de commencer, assurez-vous d'avoir Docker installé et configuré avec le proxy :\
`installation` : [Instructions d'installation Docker](http://gitlab.dev-arch-diff.ign.fr/vsasyan/install/tree/master#docker) (bien sélectionné l'os lien pour Debian)\
`gestion du proxy pour docker` : [Guide de configuration du proxy Docker](https://mborne.github.io/cours-devops/annexe/proxy-sortant/proxy-docker).\
`docker sans le sudo` : [Gestion de Docker en tant qu'utilisateur non root](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user)

git clone le projet
```
cd diffusion_lidar
docker-compose up --build
```
Si vous récupérez encore des blocs et dalles depuis S3, vous devrez remplir la base de données (cela peut prendre un certain temps). Pour ce faire, décommentez le code suivant dans backend/docker-entrypoint.sh et relancez docker-compose up --build :
```
# python3 ./api/app/adapters/migration.py
```

Une fois que docker-compose est en cours d'exécution, vous pouvez développer normalement. Pour accéder aux ressources, utilisez les liens suivants :\
`pour consulter l'api` : http://localhost:8000/docs \
`pour consulter l'interface`  : http://localhost:3000 \
`pour consulter la base de données` : http://localhost:8080

Avant de push coté backend verifier black, pylint, et tests unitaires si tu en a fais des nouveaux

pour verifier pylint à la racine du projet
```
pylint --rcfile=backend/.pylintrc --disable=fixme backend --recursive=y
```

pour verifier le formatage avec black
```
black --diff --check backend
```
Si erreur, appliquer le reformatage avec black
```
black <file>
```

test unitaire à la racine du projet
```
pytest backend/api/tests
```

run projet 
```
docker-compose up
```

## Architecture 

- `.github/` : contient tous les github action notament le deploiement automatique des images, ainsi que le check de la qualité des codes

- `backend/` : contient tout ce qui va se passer coté back (python)

    - `api/` : contient toute la partie api qui communique avec la partie frontend
        - `app/` : contient les routes et fonctions de l'api
            - `adapters/` : ensemble de fonction appeller par les routes, ou pour remplir la base de données
                - `dalle_lidar_classe.py` : toutes les fonctions que les routes api appellent pour les blocs et les dalles qu'on recupere en base de données
                - `ExtractDataFile.py` : contient l'extraction des coordonnées d'un (multi)polygon et permet de savoir aussi si son emprise dépasse une certaine limite
                - `migration.py` : communique avec la base de données pour inserer les données S3 en base
                - `s3.py` : communique avec le S3 ovh et est appeller par migration.py
            - `routes/` : contient les différentes routes de l'api
            - `main.py` : fichier lancer pour démarrer le serveur api, appelle notament les routes et configure le CORS
        - `test/` contient les test unitaires des routes et des fonctions api

    - `.pylintrc` : ensemble de règles de qualiter de code

    - `docker-entrypoint.sh` : contient ce qui est lancer en entrypoint dans le Dockerfile, notament le remplissage de la base de données, et le lancement du serveur api

    - `Dockerfile` : contient tout ce qu'il faut pour que l'api tourne correctement sous docker avec une image

    - `requirements.txt` : contient toutes les dependances à installer pour que l'api tourne

- `frontend/` : contient toute la partie front, qui appelle l'api 
    - `public/` : contient le index.html et les images qu'on utilise sur le site, notament le logo ign
    - `src/` : contient toute la partie fonctionnalité que l'on dévéloppe  (en cours de refacto)
    - `.dockerignore` : permet de ne pas copier tous les fichiers dans l'image comme le Dockerfile lui même qui n'a pas d'interet dans l'image
    - `Dockerfile` : contient tout ce qu'il faut pour que l'interface tourne correctement sous docker avec une image
    - `package-.json` : contient les dépendances pour la partie frontend qu'il faut installer avec npm install

- `.env` : contenu (avoir les accés S3 pour y acceder. Pour les env PG, hormis le port on peut changer la valeur, il les faudra pour se connecter si besoin )
    ```ACCESS_KEY=
    SECRET_KEY=
    ENDPOINT=
    REGION=
    BUCKET=

    PGDATABASE=gis
    PGHOST=db
    PGUSER=docker
    PGPASSWORD=docker
    PGPORT=5432```

- `.dockerignore` : permet de ne pas copier tous les fichiers dans l'image comme le docker-compose.yml lui même qui n'a pas d'interet dans l'image
- `.gitignore` : permet d'ignorer les fichiers qu'on ne veut pas push sur git
- `docker-compose.yml` : permet de lancer les différentes images et les faire communiquer entre elles (les images db et adminer ne sont pas en prod mais juste pour développer)
    - image api
    - image frontend
    - image db : base de données postgresql
    - image adminer : interface graphique pour consulter les données dans la base

