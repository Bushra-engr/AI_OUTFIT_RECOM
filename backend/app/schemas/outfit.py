from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OutfitRecommendRequest(BaseModel):
    occasion: str
    city: str
    skin_undertone: Optional[str] = "neutral"
    top_n: Optional[int] = 5
    include_hijab: Optional[bool] = False
    force_refresh: Optional[bool] = False

class OutfitCreate(BaseModel):
    item_ids: list[str]
    occasion: Optional[str] = None
    weather: Optional[str] = None
    reasoning: Optional[str] = None
    kept: bool = True

class OutfitResponse(BaseModel):
    id: str
    user_id: str
    item_ids: list[str]
    occasion: Optional[str] = None
    weather: Optional[str] = None
    reasoning: Optional[str] = None
    kept: bool
    date: datetime