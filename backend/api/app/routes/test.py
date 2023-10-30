from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def hello_world():
    """route test

    Returns:
        dict: retourne un message test
    """
    return {"hello": "world"}
