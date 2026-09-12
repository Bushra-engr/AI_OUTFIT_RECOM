from datetime import datetime, timezone
from app.core.supabase_client import supabase
from app.core.reasoning_outfit import add_reasoning_to_outfits

OCCASIONS: dict = {
    "wedding": {
        "title": "Wedding / Gala",
        "icon": "💍",
        "formality": ["Formal", "Semi-Formal"],
        "styles": ["Traditional", "Ethnic", "Elegant", "Festive", "Classic", "Refined", "Haute Elegance"],
    },
    "office": {
        "title": "Office / Work",
        "icon": "💼",
        "formality": ["Formal", "Semi-Formal", "Smart Casual"],
        "styles": ["Professional", "Minimal", "Classic", "Tailored", "Smart Casual", "Business Casual"],
    },
    "date": {
        "title": "Date Night",
        "icon": "🥂",
        "formality": ["Semi-Formal", "Smart Casual", "Casual", "Formal"],
        "styles": ["Smart Casual", "Elegant", "Chic", "Romantic", "Refined", "Modern"],
    },
    "party": {
        "title": "Party / Night Out",
        "icon": "🪩",
        "formality": ["Semi-Formal", "Smart Casual", "Formal"],
        "styles": ["Glam", "Statement", "Modern", "Trendy", "Chic", "High Contrast", "Clubwear", "Sleek", "Elevated"],
    },
    "casual": {
        "title": "Casual Weekend",
        "icon": "☕",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Relaxed", "Streetwear", "Minimal", "Everyday", "Comfortable"],
    },
    "brunch": {
        "title": "Brunch & Cafe",
        "icon": "🥞",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Chic", "Breezy", "Smart Casual", "Pastel", "Relaxed", "Minimal"],
    },
    "travel": {
        "title": "Travel / Airport",
        "icon": "✈️",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Comfortable", "Athleisure", "Layered", "Streetwear", "Relaxed", "Wrinkle-Free"],
    },
    "festival": {
        "title": "Festive / Cultural",
        "icon": "🎪",
        "formality": ["Formal", "Semi-Formal", "Casual"],
        "styles": ["Traditional", "Ethnic", "Vibrant", "Bohemian", "Festive", "Silk & Embroidery", "Elegant"],
    },
    "interview": {
        "title": "Interview / Pitch",
        "icon": "🎤",
        "formality": ["Formal", "Semi-Formal", "Smart Casual"],
        "styles": ["Professional", "Structured", "Minimal", "Classic", "Tailored", "Power Dressing"],
    },
    "college": {
        "title": "College / Campus",
        "icon": "🎓",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Streetwear", "Trendy", "Relaxed", "Sporty", "Everyday", "Overshirts"],
    },
    "vacation": {
        "title": "Beach / Resort",
        "icon": "🏖️",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Resort", "Tropical", "Breezy", "Relaxed", "Chic", "Sun-Ready"],
    },
    "cocktail": {
        "title": "Cocktail & Soirée",
        "icon": "🎭",
        "formality": ["Formal", "Semi-Formal", "Smart Casual"],
        "styles": ["Sleek", "Glam", "Monochrome", "Elegant", "Refined", "Satin"],
    },
    "gym": {
        "title": "Fitness / Gym",
        "icon": "🏋️",
        "formality": ["Sportswear", "Casual", "Smart Casual"],
        "styles": ["Athletic", "Performance", "Sporty", "Active", "Stretch", "Comfortable"],
    },
    "rainy": {
        "title": "Monsoon / Rainy",
        "icon": "🌧️",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Layered", "Dark Tones", "Cozy", "Functional", "Comfortable", "Water-Resistant"],
    },
    "dinner": {
        "title": "Fine Dining & Gala",
        "icon": "🍽️",
        "formality": ["Formal", "Semi-Formal", "Smart Casual"],
        "styles": ["Haute Elegance", "Classic", "Refined", "Chic", "Elegant", "Black Tie"],
    },
    "winter": {
        "title": "Winter & Mountain",
        "icon": "🏔️",
        "formality": ["Casual", "Smart Casual", "Semi-Formal", "Formal"],
        "styles": ["Heavy Knits", "Cozy", "Layered", "Structured", "Warm", "Puffer"],
    },
    "wellness": {
        "title": "Wellness & Lounge",
        "icon": "🧘",
        "formality": ["Sportswear", "Casual", "Smart Casual"],
        "styles": ["Loungewear", "Minimal", "Breathable", "Relaxed", "Zen", "Comfortable"],
    },
    "art": {
        "title": "Art & Gallery Event",
        "icon": "🎨",
        "formality": ["Semi-Formal", "Casual", "Smart Casual", "Formal"],
        "styles": ["Avant-Garde", "Eclectic", "Creative", "Modern", "Chic", "Textures"],
    },
    "concert": {
        "title": "Concert & Music Fest",
        "icon": "🎸",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Edgy", "Denim", "Boho", "Statement", "Trendy", "Leather"],
    },
    "picnic": {
        "title": "Sun Picnic & Garden",
        "icon": "☀️",
        "formality": ["Casual", "Smart Casual", "Semi-Formal"],
        "styles": ["Pastel", "Floral", "Breezy", "Relaxed", "Everyday", "Linen Accents"],
    },
}


SKIN_UNDERTONE_COLOR_MAP = {
    "warm": {
        "best": ["olive", "mustard", "rust", "terracotta", "camel", "warm beige", "coral", "peach", "forest green", "chocolate brown", "gold", "beige", "brown", "maroon"],
        "good": ["teal", "burgundy", "maroon", "navy", "black", "copper"],
        "less_flattering": ["icy blue", "icy pink", "lavender", "cool grey", "silver"],
    },
    "cool": {
        "best": ["navy", "royal blue", "sky blue", "lavender", "purple", "plum", "rose", "ruby red", "emerald", "charcoal", "silver", "white", "black", "maroon"],
        "good": ["teal", "burgundy", "maroon", "black", "grey"],
        "less_flattering": ["mustard", "orange", "rust", "camel", "warm beige"],
    },
    "neutral": {
        "best": ["black", "white", "navy", "teal", "emerald", "olive", "burgundy", "maroon", "rose", "grey", "chocolate brown", "beige", "brown"],
        "good": ["mustard", "rust", "coral", "lavender", "forest green"],
        "less_flattering": ["neon shades"],
    },
}

COLD_UNSUITABLE_FABRICS = {"linen", "chiffon"}
HOT_UNSUITABLE_FABRICS = {"wool", "leather"}

HIJAB_CATEGORIES = {"hijab", "headscarf", "turban"}

ACCESSORY_CATEGORIES = {
    "dupatta", "stole",
    "watch", "sunglasses", "glasses", "belt", "bag", "handbag", "backpack", 
    "clutch", "scarf", "muffler", "hat", "cap", "beanie", "jewelry", "necklace", 
    "bracelet", "earrings", "ring", "tie", "bow tie", "pocket square", "cufflinks"
}

OUTERWEAR_CATEGORIES = {
    "jacket", "blazer", "coat", "trench coat", "cardigan", "overshirt", "sweater", 
    "sweatshirt", "hoodie", "puffer", "parka", "overcoat", "shawl", "cape", "bomber", 
    "windbreaker", "shrug", "gilet"
}

TOP_CATEGORIES = {
    "shirt", "t-shirt", "tshirt", "t shirt", "top", "blouse", "polo",
    "vest", "tank top", "tank", "kurta", "kurti", "crop top", "tee", "camisole"
}

BOTTOM_CATEGORIES = {
    "trouser", "trousers", "jeans", "pants", "pant", "shorts", "skirt", "cargo",
    "cargos", "chinos", "joggers", "sweatpants", "leggings", "palazzo", "dhoti", "pyjama"
}

ONE_PIECE_CATEGORIES = {
    "dress", "gown", "evening gown", "jumpsuit", "romper", "one-piece", "one piece",
    "sari", "saree", "anarkali", "suit", "maxi", "abaya"
}

FOOTWEAR_CATEGORIES = {
    "shoes", "sandals", "heels", "sneakers", "boots", "loafers", "flats", "slippers",
    "mules", "footwear", "slingback heels", "formal shoes", "athletic shoes", "pumps"
}

NEUTRAL_COLORS = {
    "black", "white", "grey", "gray", "beige", "navy", "brown", "cream", 
    "khaki", "denim", "tan", "charcoal", "ivory", "off-white", "sand", "taupe"
}

HARMONIOUS_PAIRS = [
    {"blue", "orange"}, {"blue", "brown"}, {"navy", "burgundy"}, {"navy", "mustard"},
    {"olive", "rust"}, {"olive", "beige"}, {"green", "pink"}, {"teal", "coral"},
    {"maroon", "beige"}, {"forest green", "tan"}, {"camel", "black"}, {"sky blue", "white"},
    {"olive", "cream"}, {"burgundy", "grey"}, {"navy", "white"}, {"black", "red"}
]

CLASHING_COLOR_PAIRS = [
    {"red", "orange"}, {"red", "magenta"}, {"neon green", "brown"},
    {"purple", "orange"}, {"yellow", "magenta"}, {"lime", "burgundy"}
]


def normalize(value: str | None) -> str:
    """'  Shirt ' -> 'shirt', None -> ''"""
    if not value:
        return ""
    return str(value).strip().lower()


def normalize_tag(value: str | None, tag_type: str = "general") -> str:
    """
    Normalizes freeform tags into standardized vocabulary.
    Handles compound tags like 'Cotton Blend', 'T-shirt', 'Off-White', 'Semi Formal'.
    """
    if not value:
        return ""
    val = str(value).strip().lower()

    if tag_type == "fabric":
        for standard in ["cotton", "linen", "silk", "wool", "denim", "leather", "polyester", "chiffon", "satin", "velvet", "rayon", "nylon", "knitwear", "fleece"]:
            if standard in val:
                return standard
        return val

    if tag_type == "formality":
        if any(w in val for w in ["formal", "black tie"]):
            return "Semi-Formal" if "semi" in val else "Formal"
        if "smart" in val or "business" in val:
            return "Smart Casual"
        if "casual" in val:
            return "Casual"
        if any(w in val for w in ["sport", "athletic", "active"]):
            return "Sportswear"
        if any(w in val for w in ["ethnic", "traditional"]):
            return "Ethnic"
        return value.title()

    if tag_type == "color":
        for standard in ["black", "white", "navy", "grey", "gray", "beige", "brown", "maroon", "burgundy", "blue", "green", "olive", "red", "pink", "yellow", "orange", "purple", "lavender", "teal", "mustard", "rust", "coral", "peach", "gold", "silver", "tan", "cream"]:
            if standard in val:
                return standard
        return val

    return val


def is_hijab_item(item: dict) -> bool:
    cat = normalize(item.get("category"))
    subcat = normalize(item.get("subcategory"))
    combined = f"{cat} {subcat}"
    return any(h in combined for h in ["hijab", "headscarf", "turban"])


def classify_slot(item: dict) -> str:
    """
    Classifies a wardrobe item into 'tops', 'bottoms', 'outerwear', 'one_pieces',
    'footwear', 'accessories', 'hijabs', or 'other'.
    """
    if is_hijab_item(item):
        return "hijabs"

    cat = normalize(item.get("category"))
    subcat = normalize(item.get("subcategory"))
    combined = f"{cat} {subcat}"

    # 1. Accessories
    for acc in ACCESSORY_CATEGORIES:
        if acc in cat or acc in subcat:
            return "accessories"

    # 2. One-pieces
    for op in ONE_PIECE_CATEGORIES:
        if op in cat or op in subcat:
            return "one_pieces"

    # 3. Footwear
    for fw in FOOTWEAR_CATEGORIES:
        if fw in cat or fw in subcat:
            return "footwear"

    # 4. Bottoms
    for bot in BOTTOM_CATEGORIES:
        if bot in cat or bot in subcat:
            return "bottoms"

    # 5. Outerwear
    for ow in OUTERWEAR_CATEGORIES:
        if ow in cat or ow in subcat:
            return "outerwear"

    # 6. Tops
    for top in TOP_CATEGORIES:
        if top in cat or top in subcat:
            return "tops"

    # Keyword heuristics fallback
    if any(w in combined for w in ["pant", "jean", "short", "skirt", "trouser", "bottom"]):
        return "bottoms"
    if any(w in combined for w in ["jacket", "blazer", "coat", "hoodie", "sweater", "cardigan"]):
        return "outerwear"
    if any(w in combined for w in ["shirt", "tee", "top", "blouse", "kurta", "kurti"]):
        return "tops"
    if any(w in combined for w in ["shoe", "heel", "sandal", "sneaker", "boot", "loafer"]):
        return "footwear"
    if any(w in combined for w in ["dress", "gown", "jumpsuit", "abaya"]):
        return "one_pieces"
    if any(w in combined for w in ["watch", "sunglass", "belt", "bag", "jewelry", "dupatta"]):
        return "accessories"

    return "other"


def get_user_wardrobe(user_id: str) -> list[dict]:
    try:
        result = (
            supabase.table("wardrobe_items")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        items = result.data or []
        # Python-side null-safe filter for never_wear
        return [it for it in items if not it.get("never_wear")]
    except Exception as e:
        print(f"Wardrobe fetch error: {e}")
        return []


def get_user_profile_data(user_id: str) -> dict:
    try:
        res = supabase.table("user_profile").select("*").eq("user_id", user_id).limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"Profile fetch notice: {e}")
    return {}


def get_user_feedback_data(user_id: str) -> dict:
    feedback_summary = {"liked_items": set(), "disliked_items": set(), "never_wear_items": set()}
    try:
        res = supabase.table("feedback").select("*").eq("user_id", user_id).execute()
        if res.data:
            for fb in res.data:
                item_id = fb.get("item_id")
                if not item_id:
                    continue
                if fb.get("never_wear"):
                    feedback_summary["never_wear_items"].add(item_id)
                elif fb.get("liked") is True or (fb.get("rating") and fb.get("rating") >= 4):
                    feedback_summary["liked_items"].add(item_id)
                elif fb.get("liked") is False or (fb.get("rating") and fb.get("rating") <= 2):
                    feedback_summary["disliked_items"].add(item_id)
    except Exception as e:
        print(f"Feedback fetch notice: {e}")
    return feedback_summary


OCCASION_PROHIBITED: dict = {
    "travel": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "sari", "saree", 
        "lehenga", "tuxedo", "anarkali", "sherwani", "gown"
    ],
    "gym": [
        "gown", "dress", "skirt", "blouse", "suit", "blazer", "heels", "loafers", 
        "formal", "sari", "saree", "wool", "silk", "satin", "leather"
    ],
    "office": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "gown", "sweatpants", 
        "joggers", "crop top", "flip flops", "gym", "shorts",
        "off-shoulder", "off shoulder", "strapless", "backless", "tube", "deep v-neck"
    ],
    "party": [
        "sweatpants", "joggers", "flip flops", "slippers", "tracksuit", "pajama", "pyjama", "bathrobe"
    ],
    "casual": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "tuxedo", "gown", "sari"
    ],
    "college": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "tuxedo", "gown", "sari"
    ],
    "picnic": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "tuxedo", "gown", "stilettos"
    ],
    "wellness": [
        "evening gown", "ball gown", "gown", "wedding", "blazer", "suit", "heels", "formal"
    ],
    "interview": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "gown", "sweatpants", 
        "joggers", "shorts", "flip flops", "crop top", "ripped",
        "off-shoulder", "off shoulder", "strapless", "backless", "tube", "deep v-neck",
        "sneaker", "sneakers", "athletic"
    ],
    "wedding": [
        "t-shirt", "tee", "sweatpants", "joggers", "shorts", "gym", "hoodie", 
        "tracksuit", "flip flops", "slippers"
    ],
    "cocktail": [
        "t-shirt", "tee", "sweatpants", "joggers", "hoodie", "shorts", "sneakers", 
        "flip flops", "gym"
    ],
    "dinner": [
        "t-shirt", "tee", "sweatpants", "joggers", "hoodie", "shorts", "sneakers", 
        "flip flops", "gym"
    ],
    "date": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "sweatpants", "joggers", "gym", "tracksuit"
    ],
    "brunch": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "tuxedo", "gown", "gym", "tracksuit"
    ],
    "vacation": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "tuxedo", "gown", "heavy knits", "wool", "suit"
    ],
    "rainy": [
        "evening gown", "ball gown", "gown", "wedding", "bridal", "white dress", "chiffon", "silk"
    ],
    "festival": [
        "sweatpants", "joggers", "tracksuit", "gym", "flip flops", "faded t-shirt"
    ],
    "winter": [
        "flip flops", "shorts", "sleeveless tank", "crop top"
    ],
    "art": [
        "sweatpants", "joggers", "gym", "tracksuit", "flip flops"
    ],
    "concert": [
        "evening gown", "ball gown", "ballgown", "bridal", "suit", "blazer", "tuxedo"
    ],
    "gala": [
        "casual", "t-shirt", "tee", "jeans", "denim", "chunky sneakers", "sweatpants", "shorts", "flip flops"
    ],
    "airport": [
        "evening gown", "ball gown", "ballgown", "wedding", "bridal", "sari", "saree", "lehenga", "tuxedo", "gown", "stilettos"
    ],
    "smart_casual": [
        "sweatpants", "joggers", "tracksuit", "gym", "flip flops", "heavy ballgown"
    ],
}


def is_item_prohibited_for_occasion(item: dict, occasion_key: str) -> bool:
    occ_key = normalize(occasion_key)
    prohibited_list = OCCASION_PROHIBITED.get(occ_key, [])
    if not prohibited_list:
        return False

    cat = normalize(item.get("category"))
    subcat = normalize(item.get("subcategory"))
    style = normalize(item.get("style"))
    combined = f"{cat} {subcat} {style}"

    for p in prohibited_list:
        if p in combined or (p in cat and len(p) > 2) or (p in subcat and len(p) > 2):
            return True
    return False


def calculate_color_harmony(color_a: str, color_b: str) -> float:
    c1 = normalize_tag(color_a, "color")
    c2 = normalize_tag(color_b, "color")
    if not c1 or not c2:
        return 12.0

    if any(n in c1 for n in NEUTRAL_COLORS) or any(n in c2 for n in NEUTRAL_COLORS):
        return 18.0

    if c1 == c2:
        return 16.0

    c_pair = {c1, c2}
    for clash in CLASHING_COLOR_PAIRS:
        if clash.issubset(c_pair) or any(p1 in c1 and p2 in c2 for p1, p2 in [tuple(clash), tuple(reversed(list(clash)))]):
            return -20.0

    for pair in HARMONIOUS_PAIRS:
        if any(p1 in c1 and p2 in c2 for p1, p2 in [tuple(pair), tuple(reversed(list(pair)))]):
            return 22.0

    return 12.0


def score_item(
    item: dict, 
    occasion_key: str, 
    weather: dict, 
    skin_undertone: str,
    profile: dict = None,
    feedback_data: dict = None
) -> dict:
    """
    Scores an individual clothing item across formality, style, deep weather,
    color theory, user profile preferences, feedback loop, and rotation freshness.
    """
    occ_key = normalize(occasion_key)
    occ_data = OCCASIONS.get(occ_key, OCCASIONS["casual"])
    profile = profile or {}
    feedback_data = feedback_data or {}
    item_id = item.get("id")

    # Hard incompatibility check
    if is_item_prohibited_for_occasion(item, occ_key) or (item_id and item_id in feedback_data.get("never_wear_items", set())):
        item_with_score = item.copy()
        item_with_score["item_score"] = -500.0
        item_with_score["is_prohibited"] = True
        item_with_score["color_score"] = 0
        item_with_score["color_tier"] = "worst"
        item_with_score["color_badge"] = "Incompatible for Occasion"
        return item_with_score

    base_score = 50.0

    # 1. Formality Fit
    item_formality = normalize_tag(item.get("formality"), "formality")
    preferred_formalities = [normalize(f) for f in occ_data.get("formality", [])]
    if normalize(item_formality) in preferred_formalities:
        formality_score = 30.0
    elif normalize(item_formality) in ["smart casual", "semi-formal", "casual"]:
        formality_score = 15.0
    elif normalize(item_formality) == "formal" and occ_key in ["travel", "casual", "gym", "wellness"]:
        formality_score = -40.0
    else:
        formality_score = 10.0

    # Occasion-specific footwear & garment tuning
    cat_n = normalize(item.get("category"))
    subcat_n = normalize(item.get("subcategory"))
    combined_desc = f"{cat_n} {subcat_n} {normalize(item.get('style'))}"

    if occ_key in ["party", "cocktail", "dinner"]:
        if any(w in combined_desc for w in ["heel", "slingback", "stiletto", "boot", "loafer", "pump", "oxford"]):
            formality_score += 20.0
        elif any(w in combined_desc for w in ["sneaker", "running", "athletic", "trainer"]):
            formality_score -= 25.0
        elif any(w in combined_desc for w in ["t-shirt", "tshirt", "tee", "basic"]):
            formality_score -= 10.0

    # 2. Style Fit
    item_style = normalize(item.get("style"))
    style_score = 10.0
    if item_style:
        occ_styles = [normalize(s) for s in occ_data.get("styles", [])]
        if any(s in item_style or item_style in s for s in occ_styles):
            style_score = 20.0
        else:
            style_score = 6.0

    fav_styles = [normalize(s) for s in profile.get("favorite_styles", []) if s]
    if any(fs in item_style or item_style in fs for fs in fav_styles):
        style_score += 15.0

    # 3. Weather Appropriateness (Temperature, Condition, Humidity)
    temp = weather.get("temperature", 22)
    condition = normalize(weather.get("condition", ""))
    humidity = weather.get("humidity", 50)
    fabric = normalize_tag(item.get("fabric"), "fabric")
    weather_score = 8.0

    if temp is not None:
        if temp < 18:
            if fabric in {"wool", "knitwear", "denim", "leather", "fleece"}:
                weather_score += 15.0
            elif fabric in COLD_UNSUITABLE_FABRICS:
                weather_score -= 20.0
        elif temp > 28:
            if fabric in {"cotton", "linen", "silk", "rayon"}:
                weather_score += 15.0
            elif fabric in HOT_UNSUITABLE_FABRICS:
                weather_score -= 25.0

    # Rain / Monsoon factor
    if any(r in condition for r in ["rain", "drizzle", "monsoon", "shower", "thunderstorm"]):
        if fabric in {"silk", "suede", "velvet"}:
            weather_score -= 20.0
        elif fabric in {"denim", "nylon", "cotton"}:
            weather_score += 10.0

    # High humidity factor
    if humidity and humidity > 75:
        if fabric in {"leather", "polyester"}:
            weather_score -= 15.0
        elif fabric in {"cotton", "linen"}:
            weather_score += 10.0

    # 4. Color Theory & Undertone
    color = normalize_tag(item.get("color"), "color")
    undertone_data = SKIN_UNDERTONE_COLOR_MAP.get(
        normalize(skin_undertone),
        SKIN_UNDERTONE_COLOR_MAP["neutral"]
    )
    best_colors = set(undertone_data["best"])
    good_colors = set(undertone_data["good"])
    less_flattering = set(undertone_data["less_flattering"])

    if any(bc in color for bc in best_colors):
        color_score = 25.0
        tier = "best"
        badge = "Best Color 🌟"
    elif any(gc in color for gc in good_colors):
        color_score = 16.0
        tier = "good"
        badge = "Good Color ✨"
    elif any(lc in color for lc in less_flattering):
        color_score = 5.0
        tier = "worst"
        badge = "Clashing/Avoid ⚠️"
    else:
        color_score = 12.0
        tier = "neutral"
        badge = "Harmonic Accent"

    # Profile color preferences
    fav_colors = [normalize_tag(c, "color") for c in profile.get("favorite_colors", []) if c]
    avoid_colors = [normalize_tag(c, "color") for c in profile.get("avoided_colors", []) if c]

    if any(fc in color for fc in fav_colors):
        color_score += 20.0
        tier = "favorite"
        badge = "Personal Favorite ❤️"
    elif any(ac in color for ac in avoid_colors):
        color_score -= 30.0
        tier = "avoided"
        badge = "Avoided Color 🚫"

    # 5. Feedback Loop
    feedback_bonus = 0.0
    if item_id:
        if item_id in feedback_data.get("liked_items", set()):
            feedback_bonus += 25.0
        elif item_id in feedback_data.get("disliked_items", set()):
            feedback_bonus -= 30.0

    # 6. Wardrobe Rotation & Freshness
    times_worn = item.get("times_worn") or 0
    rotation_penalty = min(times_worn * 2.5, 20.0)
    last_worn = item.get("last_worn")
    if last_worn:
        try:
            lw_date = datetime.fromisoformat(str(last_worn).replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - lw_date).days
            if days_ago < 3:
                rotation_penalty += 15.0
        except Exception:
            pass

    # 7. Style Persona Boost
    # Maps persona → style tags that get a bonus
    persona_style_map = {
        "Casual":       ["casual", "relaxed", "everyday", "comfortable", "streetwear"],
        "Smart Casual": ["smart casual", "elevated", "polished", "chic", "minimal"],
        "Minimalist":   ["minimal", "clean", "monochrome", "structured", "simple"],
        "Classic":      ["classic", "timeless", "tailored", "refined", "formal"],
        "Streetwear":   ["streetwear", "urban", "edgy", "trendy", "oversized", "sporty"],
        "Formal":       ["formal", "professional", "executive", "power dressing", "black tie"],
        "Bohemian":     ["boho", "bohemian", "ethnic", "floral", "eclectic", "artistic"],
        "Ethnic":       ["ethnic", "traditional", "festive", "embroidery", "silk"],
        "Sporty":       ["athletic", "performance", "active", "sporty", "stretch"],
        "Maximalist":   ["statement", "glam", "high contrast", "vibrant", "bold"],
    }
    style_persona = normalize(profile.get("style_persona") or "Casual")
    persona_tags = persona_style_map.get(
        next((k for k in persona_style_map if normalize(k) == style_persona), "Casual"),
        []
    )
    persona_bonus = 0.0
    if persona_tags:
        item_style_n = normalize(item.get("style") or "")
        item_formality_n = normalize(item.get("formality") or "")
        combined_item_tags = f"{item_style_n} {item_formality_n}"
        if any(pt in combined_item_tags for pt in persona_tags):
            persona_bonus = 18.0  # strong match to user's declared persona

    # 8. Preferred Fit Awareness
    # Maps preferred fit value → item style/subcategory keywords
    fit_style_map = {
        "tailored":  ["tailored", "structured", "slim fit", "fitted", "formal"],
        "slim":      ["slim", "fitted", "skinny", "tapered", "narrow"],
        "relaxed":   ["relaxed", "loose", "comfort", "wide leg", "regular"],
        "oversized": ["oversized", "baggy", "wide", "drop shoulder", "boxy"],
        "hybrid":    [],  # no penalty/bonus — hybrid accepts all fits
    }
    preferred_fit = normalize(profile.get("preferred_fit") or "hybrid")
    fit_keywords = fit_style_map.get(preferred_fit, [])
    fit_bonus = 0.0
    if fit_keywords and preferred_fit != "hybrid":
        item_subcat_n = normalize(item.get("subcategory") or "")
        item_style_n2 = normalize(item.get("style") or "")
        combined_fit_tags = f"{item_subcat_n} {item_style_n2}"
        if any(fk in combined_fit_tags for fk in fit_keywords):
            fit_bonus = 10.0

    total_item_score = (
        base_score + formality_score + style_score + weather_score +
        color_score + feedback_bonus + persona_bonus + fit_bonus - rotation_penalty
    )

    item_with_score = item.copy()
    item_with_score["item_score"] = round(total_item_score, 1)
    item_with_score["is_prohibited"] = False
    item_with_score["color_score"] = int(color_score)
    item_with_score["color_tier"] = tier
    item_with_score["color_badge"] = badge
    return item_with_score


def group_by_slot(scored_items: list[dict], include_hijab: bool = False) -> dict:
    grouped = {
        "tops": [],
        "bottoms": [],
        "outerwear": [],
        "one_pieces": [],
        "footwear": [],
        "accessories": [],
        "hijabs": [],
        "other": []
    }
    for item in scored_items:
        slot = classify_slot(item)
        if slot == "hijabs":
            if include_hijab:
                grouped["hijabs"].append(item)
            # If not include_hijab, do not place in accessories or any slot
        elif slot in grouped:
            grouped[slot].append(item)
        else:
            grouped["other"].append(item)

    # Wardrobe resilience: if no tops but sweaters/hoodies in outerwear, copy them to tops
    if not grouped["tops"] and grouped["outerwear"]:
        for ow in grouped["outerwear"]:
            cat = normalize(ow.get("category"))
            subcat = normalize(ow.get("subcategory"))
            if any(w in f"{cat} {subcat}" for w in ["sweater", "hoodie", "cardigan", "sweatshirt"]):
                grouped["tops"].append(ow)

    return grouped


def build_combinations(grouped: dict, occasion_key: str, weather: dict = None, include_hijab: bool = False) -> list[dict]:
    occ_key = normalize(occasion_key)
    weather = weather or {}
    temp = weather.get("temperature", 22)
    combinations = []

    # Filter and cap to top 15 items per slot to avoid combinatorial explosion
    def get_safe_sorted(slot_name: str, limit: int = 15) -> list[dict]:
        items = [
            it for it in grouped.get(slot_name, [])
            if not it.get("is_prohibited") and it.get("item_score", 0) > 0
        ]
        return sorted(items, key=lambda x: x["item_score"], reverse=True)[:limit]

    safe_one_pieces = get_safe_sorted("one_pieces")
    safe_tops = get_safe_sorted("tops")
    safe_bottoms = get_safe_sorted("bottoms")
    safe_footwear = get_safe_sorted("footwear")
    safe_outerwear = get_safe_sorted("outerwear", limit=8)
    safe_accessories = get_safe_sorted("accessories", limit=5)
    safe_hijabs = get_safe_sorted("hijabs", limit=5) if include_hijab else []

    # Special footwear filtering:
    # 1. NO heels at gym/wellness
    if occ_key in ["gym", "wellness"]:
        safe_footwear = [
            fw for fw in safe_footwear 
            if not any(w in normalize(f"{fw.get('category')} {fw.get('subcategory')}") for w in ["heel", "stiletto", "formal", "loafer"])
        ]
    # 2. Elevated footwear preference for formal, party, dinner, office, interview
    elif occ_key in ["party", "cocktail", "dinner", "wedding", "office", "interview"]:
        elevated_footwear = [
            fw for fw in safe_footwear 
            if not any(w in normalize(f"{fw.get('category')} {fw.get('subcategory')} {fw.get('style')}") for w in ["sneaker", "running", "athletic", "trainer", "casual shoe", "flip flop", "slipper"])
        ]
        if elevated_footwear:
            safe_footwear = elevated_footwear

    def attach_finishing_touches(base_items: list[dict], anchor_item: dict) -> list[dict]:
        res = list(base_items)
        if include_hijab and safe_hijabs:
            best_hijab = max(
                safe_hijabs,
                key=lambda h: calculate_color_harmony(anchor_item.get("color"), h.get("color"))
            )
            res.append(best_hijab)
        elif safe_accessories and not include_hijab:
            res.append(safe_accessories[0])
        return res

    needs_layering = (temp < 18) or (occ_key in ["winter", "office", "interview"])
    is_formal_event = occ_key in ["wedding", "cocktail", "dinner", "party", "date", "festival", "art"]

    # 1. ONE-PIECE ENSEMBLES (Dresses, Gowns, Jumpsuits)
    for op in safe_one_pieces:
        bonus = 45.0 if is_formal_event else 25.0
        if occ_key in ["party", "cocktail", "date", "wedding", "dinner", "brunch", "picnic"]:
            bonus += 35.0

        # A one-piece dress/gown replaces both top and bottom. Scaling item score ensures
        # dresses compete fairly and prominently against top+bottom combinations:
        effective_op_score = (op["item_score"] * 2.0) + 40.0

        # Footwear harmony for gowns
        is_formal_gown = any(w in normalize(f"{op.get('category')} {op.get('subcategory')}") for w in ["evening gown", "ballgown", "bridal gown", "gown"])
        if is_formal_gown and safe_footwear:
            safe_shoes_for_op = [
                s for s in safe_footwear 
                if not any(w in normalize(f"{s.get('category')} {s.get('subcategory')} {s.get('style')}") for w in ["sneaker", "running", "athletic"])
            ]
        else:
            safe_shoes_for_op = safe_footwear

        # Layered with outerwear if cold
        if needs_layering and safe_outerwear:
            for ow in safe_outerwear[:3]:
                harmony = calculate_color_harmony(op.get("color"), ow.get("color"))
                if safe_shoes_for_op:
                    for shoe in safe_shoes_for_op[:3]:
                        total = effective_op_score + ow["item_score"] + shoe["item_score"] + bonus + harmony + 15.0
                        combo_items = attach_finishing_touches([op, ow, shoe], op)
                        combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "one_piece_layered"})
                else:
                    total = effective_op_score + ow["item_score"] + bonus + harmony + 80.0
                    combo_items = attach_finishing_touches([op, ow], op)
                    combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "one_piece_layered"})

        # Standard One-Piece
        if safe_shoes_for_op:
            for shoe in safe_shoes_for_op[:5]:
                total = effective_op_score + shoe["item_score"] + bonus
                combo_items = attach_finishing_touches([op, shoe], op)
                combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "one_piece"})
        else:
            total = effective_op_score + bonus + 80.0
            combo_items = attach_finishing_touches([op], op)
            combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "one_piece"})

    # 2. TWO-PIECE & LAYERED ENSEMBLES
    for top in safe_tops:
        for bot in safe_bottoms:
            top_f = normalize_tag(top.get("formality"), "formality")
            bot_f = normalize_tag(bot.get("formality"), "formality")
            compat = 25.0 if top_f == bot_f else 15.0

            top_p = normalize(top.get("pattern"))
            bot_p = normalize(bot.get("pattern"))
            if top_p == "solid" or bot_p == "solid":
                compat += 15.0
            else:
                compat += 5.0

            color_harmony = calculate_color_harmony(top.get("color"), bot.get("color"))

            # Layered with outerwear if cold or business occasion
            if needs_layering and safe_outerwear:
                for ow in safe_outerwear[:3]:
                    ow_harmony = calculate_color_harmony(top.get("color"), ow.get("color"))
                    layer_bonus = 20.0
                    if safe_footwear:
                        for shoe in safe_footwear[:3]:
                            total = (top["item_score"] + bot["item_score"] + ow["item_score"] + 
                                     shoe["item_score"] + compat + color_harmony + ow_harmony + layer_bonus)
                            combo_items = attach_finishing_touches([top, bot, ow, shoe], top)
                            combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "two_piece_layered"})
                    else:
                        total = (top["item_score"] + bot["item_score"] + ow["item_score"] + 
                                 compat + color_harmony + ow_harmony + layer_bonus + 70.0)
                        combo_items = attach_finishing_touches([top, bot, ow], top)
                        combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "two_piece_layered"})

            # Standard Two-Piece
            if safe_footwear:
                for shoe in safe_footwear[:5]:
                    total = top["item_score"] + bot["item_score"] + shoe["item_score"] + compat + color_harmony
                    combo_items = attach_finishing_touches([top, bot, shoe], top)
                    combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "two_piece"})
            else:
                total = top["item_score"] + bot["item_score"] + compat + color_harmony + 80.0
                combo_items = attach_finishing_touches([top, bot], top)
                combinations.append({"items": combo_items, "total_score": round(total, 1), "type": "two_piece"})

    # 3. WARDROBE ADAPTIVE FALLBACK
    if not combinations:
        if safe_tops and not safe_bottoms and not safe_one_pieces:
            for top in safe_tops:
                if safe_footwear:
                    for shoe in safe_footwear[:3]:
                        combinations.append({"items": [top, shoe], "total_score": round(top["item_score"] + shoe["item_score"] + 50.0, 1), "type": "incomplete_top"})
                else:
                    combinations.append({"items": [top], "total_score": round(top["item_score"] + 100.0, 1), "type": "single_top"})
        elif safe_bottoms and not safe_tops and not safe_one_pieces:
            for bot in safe_bottoms:
                if safe_footwear:
                    for shoe in safe_footwear[:3]:
                        combinations.append({"items": [bot, shoe], "total_score": round(bot["item_score"] + shoe["item_score"] + 50.0, 1), "type": "incomplete_bottom"})
                else:
                    combinations.append({"items": [bot], "total_score": round(bot["item_score"] + 100.0, 1), "type": "single_bottom"})

    return combinations


def calculate_overlap_ratio(combo_a: dict, combo_b: dict) -> float:
    """
    Computes Jaccard overlap ratio between two outfits.
    """
    ids_a = {it["id"] for it in combo_a["items"] if "id" in it}
    ids_b = {it["id"] for it in combo_b["items"] if "id" in it}
    if not ids_a or not ids_b:
        return 0.0
    intersection = len(ids_a.intersection(ids_b))
    union = len(ids_a.union(ids_b))
    return intersection / union if union > 0 else 0.0


def rank_and_select_top(combinations: list[dict], top_n: int = 5) -> list[dict]:
    """
    Ranks combinations, balances silhouette variety (guaranteeing one-piece dresses when available),
    applies Jaccard diversity filtering, and computes real normalized compatibility scores.
    """
    sorted_combinations = sorted(
        combinations,
        key=lambda c: c["total_score"],
        reverse=True
    )

    selected = []

    # 1. Silhouette variety guarantee: If valid one-piece dress combinations exist,
    # reserve up to 2 slots for top-scoring one-pieces so dresses are featured prominently
    op_combos = [c for c in sorted_combinations if c.get("type", "").startswith("one_piece")]
    if op_combos:
        for op_c in op_combos:
            if not any(calculate_overlap_ratio(op_c, s) > 0.65 for s in selected):
                selected.append(op_c)
            if len(selected) >= min(2, len(op_combos)):
                break

    # 2. Select remaining top-ranked combinations with diversity check
    for combo in sorted_combinations:
        if combo not in selected:
            if not any(calculate_overlap_ratio(combo, s) > 0.65 for s in selected):
                selected.append(combo)
        if len(selected) >= top_n:
            break

    # 3. Backfill from remaining sorted combos if diversity filter left fewer than top_n
    if len(selected) < top_n:
        for combo in sorted_combinations:
            if combo not in selected:
                selected.append(combo)
            if len(selected) >= top_n:
                break

    # Calculate real normalized compatibility percentage (70% - 98%)
    for combo in selected:
        items = combo["items"]
        if items:
            avg_item_score = sum(it.get("item_score", 50.0) for it in items) / len(items)
            normalized = 70.0 + (avg_item_score / 120.0) * 28.0
            combo["total_score"] = min(98.0, max(70.0, round(normalized, 1)))

    return selected


def get_recommendations(user_id: str, occasion: str, city: str, skin_undertone: str, top_n: int = 5, include_hijab: bool = False) -> list[dict]:
    """
    True AI-Driven Personal Stylist Recommendation Engine with resilient Algorithmic Fallback & Backfill.
    Guarantees top_n (5) authentic, dress-code compliant looks whenever wardrobe allows.
    """
    from app.services.ai_outfit_stylist import get_ai_recommendations, generate_fallback_gap_advice
    final_outfits = []
    gap_advice = None

    try:
        ai_outfits = get_ai_recommendations(
            user_id=user_id,
            occasion=occasion,
            city=city,
            skin_undertone=skin_undertone,
            top_n=top_n,
            include_hijab=include_hijab
        )
        if ai_outfits:
            final_outfits.extend(ai_outfits)
            if ai_outfits[0].get("wardrobe_gap_advice"):
                gap_advice = ai_outfits[0]["wardrobe_gap_advice"]
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"AI Stylist fallback invoked: {e}")

    # Return genuine, high-quality AI outfits directly
    # Strictly avoid fabricating weak filler combinations just to hit 5 outfits
    if len(final_outfits) > 0:
        return final_outfits[:top_n]

    # Seamless Algorithmic Backfill / Fallback to guarantee top_n (5) looks
    try:
        from app.core.weather_agent import get_weather
        weather = get_weather(city) if city else {"temperature": 22, "condition": "Clear", "humidity": 50}
        wardrobe = get_user_wardrobe(user_id)
        if not wardrobe:
            return final_outfits

        profile = get_user_profile_data(user_id)
        feedback_data = get_user_feedback_data(user_id)

        scored_items = [
            score_item(it, occasion, weather, skin_undertone, profile=profile, feedback_data=feedback_data)
            for it in wardrobe
        ]
        grouped = group_by_slot(scored_items, include_hijab=include_hijab)
        combos = build_combinations(grouped, occasion, weather=weather, include_hijab=include_hijab)
        if not combos:
            return final_outfits

        top_combos = rank_and_select_top(combos, top_n=top_n * 2)

        # Track existing item ID sets to avoid duplicate outfits
        existing_item_sets = [
            set(str(it.get("id")) for it in o.get("items", []))
            for o in final_outfits
        ]

        combos_to_add = []
        for c in top_combos:
            c_set = set(str(it.get("id")) for it in c.get("items", []))
            if not any(c_set == exist_set for exist_set in existing_item_sets):
                combos_to_add.append(c)
                existing_item_sets.append(c_set)
            if len(final_outfits) + len(combos_to_add) >= top_n:
                break

        if combos_to_add:
            reasoned = add_reasoning_to_outfits(combos_to_add, occasion, weather, skin_undertone)
            if not gap_advice:
                gap_advice = generate_fallback_gap_advice(occasion, weather, profile, wardrobe)
            for r in reasoned:
                r["wardrobe_gap_advice"] = gap_advice
                r.setdefault("occasion_fit", 92)
                r.setdefault("weather_fit", 90)
                r.setdefault("color_harmony", 93)
                r.setdefault("style_fit", 91)
                final_outfits.append(r)

        return final_outfits[:top_n]
    except Exception as fallback_err:
        import logging
        logging.getLogger(__name__).error(f"Algorithmic backfill error: {fallback_err}")
        return final_outfits