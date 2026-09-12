from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.supabase_client import supabase
from app.schemas.user_profile import ProfileCreate, ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/", response_model=ProfileResponse)
async def create_profile(profile: ProfileCreate, current_user: dict = Depends(get_current_user)):
    data = profile.model_dump()
    data["user_id"] = current_user["user_id"]

    result = supabase.table("user_profile").upsert(data, on_conflict="user_id").execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create profile")
    return result.data[0]


@router.patch("/", response_model=ProfileResponse)
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    data = profile.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

    result = supabase.table("user_profile").update(data).eq("user_id", current_user["user_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return result.data[0]


@router.get("/", response_model=ProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    result = supabase.table("user_profile").select("*").eq("user_id", current_user["user_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return result.data[0]