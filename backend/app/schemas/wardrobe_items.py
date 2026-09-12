from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class WardrobeItemCreate(BaseModel):
    image_url: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    formality: Optional[str] = None
    style: Optional[str] = None
    fabric: Optional[str] = None

class WardrobeItemUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    formality: Optional[str] = None
    fabric: Optional[str] = None
    never_wear: Optional[bool] = None
    style: Optional[str] = None

class WardrobeItemResponse(BaseModel):
    id: str
    user_id: str
    image_url: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    formality: Optional[str] = None
    fabric: Optional[str] = None
    times_worn: int
    style: Optional[str] = None
    last_worn: Optional[date] = None
    never_wear: bool
    created_at: datetime