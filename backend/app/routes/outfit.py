from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.services.ai_outfit_stylist import get_ai_recommendations, invalidate_user_recommendations_cache
from app.core.supabase_client import supabase
from app.schemas.outfit import OutfitRecommendRequest, OutfitCreate
from app.schemas.feedback import FeedbackCreate
from datetime import datetime
from pydantic import BaseModel
from app.core.collage_generator import generate_outfit_collage

router = APIRouter(tags=["recommend & outfit"])


class CollageRequest(BaseModel):
    items: list[dict]


@router.post("/outfit/collage")
async def create_outfit_collage(request: CollageRequest, current_user: dict = Depends(get_current_user)):
    try:
        collage_url = generate_outfit_collage(request.items)
        return {"collage_url": collage_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collage generation failed: {str(e)}")


@router.post("/recommend/")
async def recommend_outfits(request: OutfitRecommendRequest, current_user: dict = Depends(get_current_user)):
    try:
        outfits = get_ai_recommendations(
            user_id=current_user["user_id"],
            occasion=request.occasion,
            city=request.city,
            skin_undertone=request.skin_undertone,
            top_n=request.top_n or 5,
            include_hijab=bool(request.include_hijab),
            force_refresh=bool(request.force_refresh)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")
    return outfits or []


@router.post("/outfit/save")
async def save_outfit(outfit: OutfitCreate, current_user: dict = Depends(get_current_user)):
    data = outfit.model_dump()
    data["user_id"] = current_user["user_id"]
    data["kept"] = True  # strictly ensure saved outfits are always kept=True

    result = supabase.table("outfit_history").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to save outfit")

    for i_id in data.get("item_ids") or []:
        try:
            it_res = supabase.table("wardrobe_items").select("times_worn").eq("id", str(i_id)).eq("user_id", current_user["user_id"]).execute()
            if it_res.data:
                current_times = it_res.data[0].get("times_worn") or 0
                supabase.table("wardrobe_items").update({
                    "times_worn": current_times + 1,
                    "last_worn": datetime.now().isoformat()
                }).eq("id", str(i_id)).eq("user_id", current_user["user_id"]).execute()
        except Exception as e:
            print(f"Notice: times_worn increment for {i_id} skipped: {e}")

    return result.data[0]


@router.get("/outfit/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    result = (
        supabase.table("outfit_history")
        .select("*")
        .eq("user_id", current_user["user_id"])
        .neq("kept", False)
        .order("date", desc=True)
        .execute()
    )
    history = result.data or []

    if history:
        items_res = (
            supabase.table("wardrobe_items")
            .select("id, image_url, category, subcategory, color, fabric, style")
            .eq("user_id", current_user["user_id"])
            .execute()
        )
        items_by_id = {str(it["id"]): it for it in (items_res.data or [])}
        for entry in history:
            entry["items"] = [items_by_id[str(i_id)] for i_id in (entry.get("item_ids") or []) if str(i_id) in items_by_id]

    return history


@router.delete("/outfit/history/{history_id}")
async def delete_history_item(history_id: str, current_user: dict = Depends(get_current_user)):
    supabase.table("outfit_history").delete().eq("id", history_id).eq("user_id", current_user["user_id"]).execute()
    return {"success": True, "message": "History entry removed"}


@router.post("/outfit/feedback")
async def submit_feedback(feedback: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    if not feedback.item_id and not feedback.outfit_id:
        raise HTTPException(status_code=400, detail="Provide either item_id or outfit_id")

    data = feedback.model_dump()
    data["user_id"] = current_user["user_id"]

    result = supabase.table("feedback").insert(data).execute()

    if feedback.item_id and feedback.never_wear:
        supabase.table("wardrobe_items").update({"never_wear": True}).eq("id", feedback.item_id).eq("user_id", current_user["user_id"]).execute()

    invalidate_user_recommendations_cache(current_user["user_id"])
    return result.data[0] if result.data else {"success": True}


@router.get("/api/weather")
async def fetch_weather_api(city: str = "Noida"):
    from app.core.weather_agent import get_weather
    try:
        return {"success": True, "weather": get_weather(city)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {str(e)}")