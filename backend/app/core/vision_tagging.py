import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.groq_api_key)

TAGGING_PROMPT = """You are a fashion cataloging assistant. Look at this clothing item image and return ONLY a JSON object with these exact keys:

{
  "category": "one of: Shirt, T-shirt, Trouser, Jeans, Top, Dress, Jacket, Hijab, Watch, Sunglasses, Sandals, Heels, Shoes, Other",
  "subcategory": "a more specific label, e.g. 'Casual Shirt', 'Formal Trouser', 'Chiffon Hijab', 'Jersey Hijab', 'Silk Hijab', 'Modal Hijab', 'Turban'",
  "color": "dominant color, one or two words",
  "style": "one of: minimal, professional, modest, ethnic, elegant, smart casual, athletic, performance, traditional",
  "pattern": "e.g. Solid, Checkered, Striped, Printed, Floral",
  "formality": "one of: Casual, Formal, Semi-Formal, Sportswear",
  "fabric": "best guess, e.g. Cotton, Denim, Silk, Chiffon, Modal, Jersey, Polyester, Leather"
}

Return ONLY the JSON object, no extra text, no explanation."""


def tag_clothing_image(image_url: str) -> dict:
    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": TAGGING_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }],
            temperature=0.3,
            max_completion_tokens=512,
            response_format={"type": "json_object"},
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Vision tagging failed: {e}")
        return {
            "category": None, "subcategory": None, "color": None,
            "pattern": None, "formality": None, "fabric": None, "style": None
        }