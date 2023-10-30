from fastapi import APIRouter

router = APIRouter(
    prefix="api/hello_world",
    tags=["test"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
def hello_world():
    """route test

    Returns:
        dict: retourne un message test
    """
    return {"hello": "world"}
