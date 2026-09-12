from pydantic import BaseModel, Field
from typing import Annotated, Literal

SkinTone = Literal["warm", "cool", "neutral"]
Gender = Literal["male", "female", "other", "prefer_not_to_say"]

class ProfileCreate(BaseModel):
    skin_tone: SkinTone = "neutral"
    height: Annotated[float | None, Field(gt=50, lt=250, description="Height in cm")] = None
    weight: Annotated[float | None, Field(gt=20, lt=300, description="Weight in kg")] = None
    gender: Gender | None = "prefer_not_to_say"
    favorite_colors: list[str] = Field(default_factory=list)
    avoided_colors: list[str] = Field(default_factory=list)
    favorite_styles: list[str] = Field(default_factory=list)
    sizes: dict[str, str] = Field(default_factory=dict)

class ProfileUpdate(BaseModel):
    skin_tone: SkinTone | None = None
    height: Annotated[float | None, Field(gt=50, lt=250)] = None
    weight: Annotated[float | None, Field(gt=20, lt=300)] = None
    gender: Gender | None = None
    favorite_colors: list[str] | None = None
    avoided_colors: list[str] | None = None
    favorite_styles: list[str] | None = None
    sizes: dict[str, str] | None = None

class ProfileResponse(ProfileCreate):
    user_id: str