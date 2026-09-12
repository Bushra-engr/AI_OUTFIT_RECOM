from typing import Optional
from fastapi import APIRouter, HTTPException, status, File, Depends, UploadFile
from PIL import Image
from io import BytesIO
from app.core.security import get_current_user
from app.core.supabase_client import supabase
import uuid
from app.core.vision_tagging import tag_clothing_image
from app.schemas.wardrobe_items import WardrobeItemUpdate, WardrobeItemCreate, WardrobeItemResponse
from app.services.ai_outfit_stylist import invalidate_user_recommendations_cache

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".jfif", ".png", ".webp", ".heic", ".heif"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
BUCKET_NAME = "wardobe-images"

_rembg_session = None


def get_rembg_session():
    global _rembg_session
    if _rembg_session is None:
        from rembg import new_session
        _rembg_session = new_session("u2net")
    return _rembg_session


@router.post("/upload", response_model=WardrobeItemResponse)
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="file name is missing!")

    extension = "." + file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPG, JPEG, PNG, HEIC and HEIF images are allowed")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")

    content = await file.read()
    image = Image.open(BytesIO(content)).convert("RGB")
    image.thumbnail((800, 800))

    from rembg import remove
    session = get_rembg_session()
    image_no_bg = remove(image, session=session)
    if image_no_bg.mode == "RGBA":
        background = Image.new("RGB", image_no_bg.size, (255, 255, 255))
        background.paste(image_no_bg, mask=image_no_bg.split()[3])
        image_no_bg = background

    buffer = BytesIO()
    image_no_bg.save(buffer, format="JPEG", quality=80)
    compressed_bytes = buffer.getvalue()

    unique_filename = f"{uuid.uuid4()}.jpg"
    supabase.storage.from_(BUCKET_NAME).upload(unique_filename, compressed_bytes, {"content-type": "image/jpeg"})
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)

    tags = tag_clothing_image(public_url)
    item_data = WardrobeItemCreate(
        image_url=public_url,
        category=tags.get("category"),
        subcategory=tags.get("subcategory"),
        color=tags.get("color"),
        pattern=tags.get("pattern"),
        formality=tags.get("formality"),
        fabric=tags.get("fabric"),
        style=tags.get("style"),
    )
    insert_data = item_data.model_dump()
    insert_data["user_id"] = current_user["user_id"]

    result = supabase.table("wardrobe_items").insert(insert_data).execute()
    invalidate_user_recommendations_cache(current_user["user_id"])
    return result.data[0]


@router.get("/", response_model=list[WardrobeItemResponse])
async def get_wardrobe(category: Optional[str] = None, current_user=Depends(get_current_user)):
    query = supabase.table("wardrobe_items").select("*").eq("user_id", current_user["user_id"])
    if category:
        cat_lower = category.strip().lower()
        if cat_lower in ["hijab", "hijabs", "modest"]:
            query = query.or_("category.ilike.%hijab%,subcategory.ilike.%hijab%,subcategory.ilike.%headscarf%,subcategory.ilike.%turban%,category.ilike.%abaya%")
        else:
            query = query.ilike("category", f"%{category.strip()}%")
    result = query.execute()
    return result.data


@router.patch("/{item_id}", response_model=WardrobeItemResponse)
async def update_wardrobe_item(item_id: str, updates: WardrobeItemUpdate, current_user=Depends(get_current_user)):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = (
        supabase.table("wardrobe_items")
        .update(update_data)
        .eq("id", item_id)
        .eq("user_id", current_user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    invalidate_user_recommendations_cache(current_user["user_id"])
    return result.data[0]


@router.delete("/{item_id}")
async def delete_wardrobe_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = (
        supabase.table("wardrobe_items")
        .delete()
        .eq("id", item_id)
        .eq("user_id", current_user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    invalidate_user_recommendations_cache(current_user["user_id"])
    return {"message": "Item deleted successfully"}