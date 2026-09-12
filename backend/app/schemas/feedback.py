from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    item_id: Optional[str] = None
    outfit_id: Optional[str] = None
    rating: Optional[int] = None
    liked: Optional[bool] = None
    never_wear: Optional[bool] = False