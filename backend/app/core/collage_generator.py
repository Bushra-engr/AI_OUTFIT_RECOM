import requests
from PIL import Image, ImageDraw, ImageFilter
from io import BytesIO
import uuid
import logging
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

CANVAS_SIZE = (800, 1000)
BG_COLOR = (250, 248, 245)  # Warm luxury off-white / editorial linen
BUCKET_NAME = "wardobe-images"


def download_image(url: str) -> Image.Image:
    """Download image, ensure RGBA, and make outer pure-white background transparent if needed."""
    response = requests.get(url, timeout=12)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content)).convert("RGBA")

    # If image has an opaque background, check if corners are near-white.
    w, h = img.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    is_white_bg = True
    for cx, cy in corners:
        r, g, b, a = img.getpixel((cx, cy))
        if not (r > 235 and g > 235 and b > 235):
            is_white_bg = False
            break

    if is_white_bg:
        try:
            for cx, cy in corners:
                ImageDraw.floodfill(img, (cx, cy), (0, 0, 0, 0), thresh=25)
        except Exception as e:
            logger.debug(f"Corner floodfill skipped: {e}")

    return img


Alassify_map = []

def classify_for_layout(item: dict) -> str:
    """Classify wardrobe piece into appropriate flat-lay slot."""
    cat = (item.get("category") or "").lower()
    sub = (item.get("subcategory") or "").lower()
    combined = f"{cat} {sub}"

    if any(k in combined for k in ["dress", "gown", "jumpsuit", "saree", "romper", "one_piece", "one piece"]):
        return "one_piece"
    if any(k in combined for k in ["jacket", "blazer", "coat", "outerwear", "shacket", "cardigan", "overcoat"]):
        return "outerwear"
    if any(k in combined for k in ["shirt", "t-shirt", "tshirt", "top", "blouse", "sweater", "hoodie", "tank", "polo", "tee"]):
        return "top"
    if any(k in combined for k in ["trouser", "pant", "chinos", "cargo", "bottom", "jean", "denim", "skirt", "shorts"]):
        return "bottom"
    if any(k in combined for k in ["heel", "shoe", "sneaker", "boot", "footwear", "loafer", "sandal", "slide"]):
        return "footwear"
    if any(k in combined for k in ["hijab", "headscarf", "turban", "dupatta", "bag", "handbag", "purse", "sunglasses", "belt", "hat", "cap", "watch", "scarf", "jewelry"]):
        return "accessory"
    return "accessory"


def apply_drop_shadow(canvas: Image.Image, item_img: Image.Image, pos: tuple[int, int], offset=(0, 6), blur=10, opacity=40):
    """Adds a soft realistic photo shadow under the garment."""
    try:
        alpha = item_img.split()[3]
        shadow = Image.new("RGBA", item_img.size, (25, 20, 25, opacity))
        shadow.putalpha(alpha)

        pad = blur * 2
        padded = Image.new("RGBA", (item_img.width + pad * 2, item_img.height + pad * 2), (0, 0, 0, 0))
        padded.paste(shadow, (pad + offset[0], pad + offset[1]))
        blurred = padded.filter(ImageFilter.GaussianBlur(blur))

        canvas.paste(blurred, (pos[0] - pad, pos[1] - pad), blurred)
    except Exception as e:
        logger.debug(f"Shadow effect skipped: {e}")


def generate_outfit_collage(items: list[dict]) -> str:
    """
    Generates a single Pinterest-style flat-lay composite image from outfit items,
    uploads it to Supabase Storage, and returns the public CDN URL.
    """
    if not items:
        raise ValueError("Cannot generate collage from empty items list.")

    # Group items by classified slot
    items_by_slot = {}
    for it in items:
        slot = classify_for_layout(it)
        if slot not in items_by_slot:
            items_by_slot[slot] = it

    has_one_piece = "one_piece" in items_by_slot
    has_outerwear = "outerwear" in items_by_slot

    # Determine layout coordinates (x, y, max_w, max_h)
    if has_one_piece:
        slots = {
            "one_piece": (160, 50, 480, 620),
            "outerwear": (40, 60, 240, 320),
            "footwear": (270, 710, 260, 220),
            "accessory": (610, 70, 150, 150),
        }
    else:
        if has_outerwear:
            slots = {
                "outerwear": (60, 40, 290, 380),
                "top": (260, 60, 340, 350),
                "bottom": (210, 420, 380, 360),
                "footwear": (260, 760, 280, 200),
                "accessory": (610, 60, 150, 150),
            }
        else:
            slots = {
                "top": (200, 40, 400, 380),
                "bottom": (210, 410, 380, 360),
                "footwear": (260, 760, 280, 200),
                "accessory": (610, 60, 150, 150),
            }

    # Create off-white luxury canvas
    canvas = Image.new("RGBA", CANVAS_SIZE, (*BG_COLOR, 255))

    # Render order: outerwear/top first, then bottom, footwear, accessory on top
    render_order = ["outerwear", "top", "one_piece", "bottom", "footwear", "accessory"]

    for slot in render_order:
        if slot not in items_by_slot or slot not in slots:
            continue

        item = items_by_slot[slot]
        img_url = item.get("image_url")
        if not img_url:
            continue

        x, y, max_w, max_h = slots[slot]

        try:
            img = download_image(img_url)
            img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

            # Center within slot
            offset_x = x + (max_w - img.width) // 2
            offset_y = y + (max_h - img.height) // 2
            pos = (offset_x, offset_y)

            # 1. Subtle drop shadow
            apply_drop_shadow(canvas, img, pos)

            # 2. Paste garment using its alpha mask
            canvas.paste(img, pos, img)

        except Exception as e:
            logger.error(f"Collage: failed to place {slot} ({item.get('id')}): {e}")
            continue

    # Flatten onto high-quality RGB background
    final = Image.new("RGB", CANVAS_SIZE, BG_COLOR)
    final.paste(canvas, (0, 0), canvas)

    # Save to buffer
    buffer = BytesIO()
    final.save(buffer, format="JPEG", quality=90, optimize=True)
    compressed_bytes = buffer.getvalue()

    # Upload to Supabase Storage
    filename = f"collage_{uuid.uuid4().hex[:12]}.jpg"
    res = supabase.storage.from_(BUCKET_NAME).upload(
        filename,
        compressed_bytes,
        {"content-type": "image/jpeg"}
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
    return public_url
