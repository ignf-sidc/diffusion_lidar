from fastapi import APIRouter

router = APIRouter()


@router.get("/api")
def hello_world():
    """route test

    Returns:
        dict: retourne un message test
    """
    return {"hello": "world"}
