import os
import json
import time
import logging
import concurrent.futures
from datetime import datetime, timezone
from typing import Optional

from groq import Groq
from app.core.config import settings
from app.core.supabase_client import supabase
from app.core.weather_agent import get_weather

logger = logging.getLogger(__name__)
groq_client = Groq(api_key=settings.groq_api_key)

# In-memory recommendation cache (5 min TTL) for instant 0ms responses on repeated occasion selections
_AI_RECOMMENDATIONS_CACHE: dict[str, tuple[float, list[dict]]] = {}
RECOM_CACHE_TTL = 300  # 5 minutes


def invalidate_user_recommendations_cache(user_id: str = None):
    """Invalidates cached recommendations for a specific user or all users."""
    global _AI_RECOMMENDATIONS_CACHE
    if user_id:
        _AI_RECOMMENDATIONS_CACHE = {k: v for k, v in _AI_RECOMMENDATIONS_CACHE.items() if not k.startswith(f"{user_id}:")}
    else:
        _AI_RECOMMENDATIONS_CACHE.clear()


# Semantic Occasion Profiles to guide the AI stylist's fashion reasoning
OCCASION_SEMANTICS: dict = {
    "party": {
        "title": "Party / Night Out",
        "description": "Vibrant social night out, club, celebration, or evening party.",
        "desired_vibes": ["elevated", "glam", "statement", "chic", "sleek", "modern evening"],
        "inappropriate": ["sleepwear", "sweatpants", "casual gym wear", "basic daytime loungewear", "basic t-shirt", "flip flops", "chunky sneakers", "athletic shoes", "hoodies", "stiff corporate suits"],
    },
    "wedding": {
        "title": "Wedding / Gala",
        "description": "Formal marriage celebration, ceremonial reception, or festive gala.",
        "desired_vibes": ["formal", "festive", "regal elegance", "traditional ethnic", "sophisticated luxe"],
        "inappropriate": ["t-shirts", "jeans", "denim", "casual sneakers", "shorts", "sweatpants", "hoodies", "flip flops"],
    },
    "office": {
        "title": "Office / Work",
        "description": "Corporate, professional, business casual or modern workplace.",
        "desired_vibes": ["professional", "tailored", "smart casual", "structured", "refined minimal"],
        "inappropriate": [
            "off-shoulder", "off-shoulder dress", "strapless", "backless", "tube top", "deep v-neck",
            "beachwear", "revealing clubwear", "sweatpants", "ripped denim", "distressed jeans",
            "flip flops", "evening gowns", "ballgowns", "crop tops"
        ],
    },
    "date": {
        "title": "Date Night",
        "description": "Romantic dinner, drinks, or intimate evening with someone special.",
        "desired_vibes": ["elevated", "chic", "alluring", "polished", "romantic", "minimal midi dresses", "flattering slip dresses", "chic frocks"],
        "inappropriate": [
            "sloppy loungewear", "baggy gym clothes", "athletic sweatpants", "scruffy shoes", "flip flops", "sleepwear",
            "heavy corporate suits", "overly ornate bridal gowns", "heavy floor-length ballgowns", "basic t-shirt", "running shoes"
        ],
    },
    "casual": {
        "title": "Casual Weekend",
        "description": "Relaxed off-duty weekend, coffee run, errands, or low-key hangout.",
        "desired_vibes": ["effortless", "comfortable", "stylish casual", "relaxed modern", "streetwear", "casual day dresses"],
        "inappropriate": ["formal ball gowns", "stiff black-tie suits", "overly ornate gala attire"],
    },
    "brunch": {
        "title": "Brunch & Cafe",
        "description": "Daytime social dining, cafe hangout, or sunny weekend gathering.",
        "desired_vibes": ["breezy chic", "pastels", "smart daytime", "crisp", "relaxed elegance", "breezy sundresses", "cotton midi dresses", "daytime frocks"],
        "inappropriate": ["dark heavy evening gowns", "gym clothes", "nightclub attire", "flip flops"],
    },
    "travel": {
        "title": "Travel / Airport",
        "description": "In-transit journey, flight, train, or road trip.",
        "desired_vibes": ["comfortable", "wrinkle-resistant", "layered", "elevated athleisure", "practical chic"],
        "inappropriate": ["stiff formal suits", "high stilettos", "delicate gala silks"],
    },
    "festival": {
        "title": "Festive / Cultural",
        "description": "Cultural celebrations, traditional holidays, festive gatherings.",
        "desired_vibes": ["traditional", "ethnic", "vibrant", "ornate", "festive celebration"],
        "inappropriate": ["plain gym wear", "faded casual tees", "scruffy sneakers"],
    },
    "interview": {
        "title": "Interview / Pitch",
        "description": "High-stakes professional job interview, corporate presentation, or executive pitch.",
        "desired_vibes": ["executive authority", "structured", "tailored formal", "clean", "trustworthy poise"],
        "inappropriate": [
            "off-shoulder", "strapless", "backless", "jeans", "denim", "casual t-shirts", "tees",
            "sneakers", "crop tops", "flip flops", "evening gowns", "clubwear", "sweatpants"
        ],
    },
    "college": {
        "title": "College / Campus",
        "description": "University classes, study sessions, campus lifestyle.",
        "desired_vibes": ["trendy streetwear", "preppy casual", "comfortable", "stylish student", "overshirts"],
        "inappropriate": ["evening gowns", "black tie tuxedos", "heavy gala jewelry"],
    },
    "vacation": {
        "title": "Beach / Resort",
        "description": "Holiday resort, coastal getaway, tropical retreat.",
        "desired_vibes": ["resort luxe", "breezy linen", "sun-ready", "lightweight", "relaxed chic", "minimal sundresses", "flowy midi dresses", "breezy frocks"],
        "inappropriate": ["heavy wool coats", "dark business suits", "formal leather boots", "heavy floor-length ballgowns", "stiff corporate blazers"],
    },
    "cocktail": {
        "title": "Cocktail & Soirée",
        "description": "Semi-formal evening drinks, art soirée, or upscale social reception.",
        "desired_vibes": ["glam", "tailored dusk", "sleek monochrome", "cocktail dress", "refined"],
        "inappropriate": ["t-shirts", "chunky sneakers", "hoodies", "sweatpants", "casual denim"],
    },
    "gym": {
        "title": "Fitness / Gym",
        "description": "Active workout, fitness training, pilates, or athletic training.",
        "desired_vibes": ["athletic performance", "breathable", "moisture-wicking", "functional", "stretch"],
        "inappropriate": ["heels", "formal trousers", "leather shoes", "dresses", "blazers", "silk", "wool"],
    },
    "dinner": {
        "title": "Fine Dining & Dinner",
        "description": "Upscale restaurant dinner, elegant evening meal, romantic dusk.",
        "desired_vibes": ["haute elegance", "refined", "subtle luxury", "chic tailored", "flattering", "minimal midi dresses", "slip dresses", "cocktail dresses"],
        "inappropriate": ["athletic gym shorts", "basic t-shirts", "running sneakers", "sweatpants", "flip flops", "heavy ornate bridal gowns"],
    },
    "gala": {
        "title": "Gala & Black Tie",
        "description": "High-glamour gala, red carpet, opera, or prestigious black-tie ball.",
        "desired_vibes": ["haute couture", "floor-length luxury", "regal elegance", "black tie formal", "statement"],
        "inappropriate": ["casual t-shirts", "jeans", "denim", "chunky sneakers", "sweatpants", "daytime sportswear"],
    },
    "concert": {
        "title": "Concert & Music Fest",
        "description": "Live music show, festival, stadium tour, or nightlife music gig.",
        "desired_vibes": ["rock chic", "statement edgy", "comfortable movement", "streetwear glam", "trendy"],
        "inappropriate": ["stiff corporate suits", "formal evening gowns", "fragile ballgowns"],
    },
    "airport": {
        "title": "Airport & Transit",
        "description": "Comfortable long-haul transit, flight travel, chic jet-set style.",
        "desired_vibes": ["jet-set chic", "elevated athleisure", "breathable layers", "wrinkle-free", "travel ease"],
        "inappropriate": ["heavy formal ballgowns", "stiff stilettos", "rigid tight suits"],
    },
    "smart_casual": {
        "title": "Smart Casual & Friday",
        "description": "Relaxed professional setting, Friday office, business lunch, creative agency.",
        "desired_vibes": ["smart tailored ease", "polished casual", "crisp balance", "modern professional"],
        "inappropriate": ["gym sweatpants", "flip flops", "ripped tank tops", "heavy ballgowns"],
    },
    "rainy": {
        "title": "Monsoon / Rainy",
        "description": "Wet weather, humid or rainy climate, puddle-ready commute.",
        "desired_vibes": ["dark tones", "weather-functional", "breathable", "smart casual ease", "practical chic"],
        "inappropriate": ["floor-length silk gowns", "white delicate dresses", "suede shoes", "fragile ballgowns", "flip flops"],
    },
    "winter": {
        "title": "Winter & Mountain",
        "description": "Chilly weather, alpine retreat, or crisp cold seasonal outings.",
        "desired_vibes": ["cozy knitwear", "tailored layering", "structured warmth", "rich textures"],
        "inappropriate": ["summer linen shorts", "sleeveless tank tops", "open-toe flip flops", "crop tops"],
    },
    "wellness": {
        "title": "Wellness & Lounge",
        "description": "Spa retreat, holistic wellness, mindful yoga, or low-key lounge.",
        "desired_vibes": ["breathable stretch", "soft neutrals", "zen comfort", "relaxed minimal"],
        "inappropriate": ["high heels", "stilettos", "stiff corporate suits", "evening gowns", "rigid structured blazers"],
    },
    "art": {
        "title": "Art & Gallery Event",
        "description": "Gallery opening, museum tour, design exhibition, or creative social.",
        "desired_vibes": ["creative chic", "avant-garde textures", "modern minimal", "statement silhouette"],
        "inappropriate": ["gym sweatpants", "flip flops", "scruffy athletic wear", "sloppy loungewear"],
    },
    "picnic": {
        "title": "Sun Picnic & Garden",
        "description": "Outdoor park gathering, garden social, or sunny daytime lawn event.",
        "desired_vibes": ["breezy daytime", "comfortable flats", "relaxed cotton", "sun-ready charm"],
        "inappropriate": ["stilettos", "pencil heels that sink into grass", "formal black-tie gowns", "stiff corporate suits"],
    },
}


def get_user_wardrobe_items(user_id: str) -> list[dict]:
    """Retrieves all active, non-never-wear wardrobe items for a given user from Supabase."""
    try:
        res = (
            supabase.table("wardrobe_items")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        items = res.data or []
        # Exclude never_wear items
        return [it for it in items if not it.get("never_wear")]
    except Exception as e:
        logger.error(f"Error fetching user wardrobe: {e}")
        return []


def get_user_profile(user_id: str) -> dict:
    """Retrieves user style preferences, skin tone, persona and sizing."""
    try:
        res = supabase.table("user_profile").select("*").eq("user_id", user_id).limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Notice fetching user profile: {e}")
    return {}


def get_user_feedback(user_id: str) -> dict:
    """Retrieves user feedback history to honor favorites and blacklists."""
    summary = {
        "liked_items": set(),
        "disliked_items": set(),
        "never_wear_items": set(),
        "ratings": {},
    }
    try:
        res = supabase.table("feedback").select("*").eq("user_id", user_id).execute()
        if res.data:
            for fb in res.data:
                iid = fb.get("item_id")
                if not iid:
                    continue
                if fb.get("never_wear"):
                    summary["never_wear_items"].add(iid)
                elif fb.get("liked") is True or (fb.get("rating") and fb.get("rating") >= 4):
                    summary["liked_items"].add(iid)
                elif fb.get("liked") is False or (fb.get("rating") and fb.get("rating") <= 2):
                    summary["disliked_items"].add(iid)
                if fb.get("rating"):
                    summary["ratings"][iid] = fb["rating"]
    except Exception as e:
        logger.warning(f"Notice fetching feedback: {e}")
    return summary


def build_stylist_context(
    wardrobe: list[dict],
    occasion_key: str,
    weather: dict,
    profile: dict,
    feedback_data: dict,
    include_hijab: bool = False
) -> dict:
    """Constructs a clean, structured context payload for the AI Stylist."""
    occ_key_clean = (occasion_key or "casual").strip().lower().replace("-", "_").replace(" ", "_")
    alias_map = {
        "beach": "vacation",
        "resort": "vacation",
        "holiday": "vacation",
        "date_night": "date",
        "fine_dining": "dinner",
        "work": "office",
        "gala": "wedding",
    }
    canonical_key = alias_map.get(occ_key_clean, occ_key_clean)
    occ_info = OCCASION_SEMANTICS.get(canonical_key, OCCASION_SEMANTICS.get(occ_key_clean, {
        "title": occ_key_clean.replace("_", " ").title(),
        "description": f"Ensemble curated specifically for {occ_key_clean}.",
        "desired_vibes": ["stylish", "well-proportioned", "occasion-appropriate"],
        "inappropriate": ["incompatible dress codes"],
    }))

    # Prepare compact item inventory with numbered references for extreme token efficiency & accuracy
    compact_inventory = []
    index_map = {}
    item_num = 1

    for it in wardrobe:
        iid = str(it.get("id"))
        if iid in feedback_data.get("never_wear_items", set()):
            continue  # Hard drop never_wear items before AI even sees them

        # Strictly exclude hijab items if user has NOT enabled include_hijab
        is_hijab_item = any(h in (str(it.get("category", "")) + " " + str(it.get("subcategory", ""))).lower() for h in ["hijab", "headscarf", "turban"])
        if not include_hijab and is_hijab_item:
            continue

        index_map[item_num] = iid
        subcat = it.get("subcategory") or it.get("category") or "garment"
        cat = it.get("category") or "piece"
        col = it.get("color") or "neutral"
        form = it.get("formality") or "Casual"
        style = it.get("style") or "Classic"
        fabric = it.get("fabric") or "cotton"

        sentiment_tag = ""
        if iid in feedback_data.get("liked_items", set()):
            sentiment_tag = " [User Favorite ❤️]"
        elif iid in feedback_data.get("disliked_items", set()):
            sentiment_tag = " [User Disliked]"

        line = f"[{item_num}] {col} {subcat} (category: {cat}, formality: {form}, style: {style}, fabric: {fabric}){sentiment_tag}"
        compact_inventory.append(line)
        item_num += 1

    context = {
        "include_hijab": include_hijab,
        "occasion": {
            "key": occ_key_clean,
            "title": occ_info["title"],
            "description": occ_info["description"],
            "desired_aesthetic": occ_info["desired_vibes"],
            "strictly_avoid": occ_info["inappropriate"],
        },
        "weather": {
            "city": weather.get("city", "Current City"),
            "temperature_celsius": weather.get("temperature", 22),
            "feels_like": weather.get("feels_like", weather.get("temperature", 22)),
            "condition": weather.get("condition", "Clear"),
            "humidity_percent": weather.get("humidity", 50),
            "wind_kmh": weather.get("wind", 10),
            "season_tag": weather.get("season_tag", "Seasonal"),
            "fabric_recommendation": weather.get("fabrics_recommended", "Breathable natural weaves"),
            "fashion_weather_advice": weather.get("fashion_advice", "Dress comfortably for the day."),
        },
        "client_profile": {
            "skin_undertone": profile.get("skin_tone") or "neutral",
            "style_persona": profile.get("style_persona") or "Modern Smart Casual",
            "preferred_fit": profile.get("preferred_fit") or "Tailored/Relaxed",
            "favorite_colors": profile.get("favorite_colors") or [],
            "avoided_colors": profile.get("avoided_colors") or [],
            "favorite_styles": profile.get("favorite_styles") or [],
        },
        "wardrobe_inventory": compact_inventory,
        "index_map": index_map,
    }
    return context


def build_outfit_prompt(context: dict, top_n: int = 5) -> str:
    """Builds an authentic, high-fashion prompt for genuine AI stylist reasoning."""
    wardrobe_inv = context.get('wardrobe_inventory', [])
    wardrobe_count = len(wardrobe_inv)

    if isinstance(wardrobe_inv, list):
        if wardrobe_inv and isinstance(wardrobe_inv[0], str):
            inventory_text = "\n".join(wardrobe_inv)
        else:
            inventory_text = json.dumps(wardrobe_inv)
    else:
        inventory_text = str(wardrobe_inv)

    target_count = top_n
    capsule_guidance = f"Curate {target_count} distinct, creative, and authentic outfit ensembles tailored for this occasion."

    include_hijab = context.get("include_hijab", False)
    if include_hijab:
        hijab_guideline = """5. Mandatory Modest Hijab Coordination:
   - The client has explicitly requested styling with a Hijab.
   - EVERY curated ensemble MUST include exactly ONE matching Hijab or headscarf from the inventory.
   - Coordinate the hijab's color and fabric (e.g. lightweight chiffon, breathable modal/cotton, silk) harmoniously with the ensemble, skin undertone, and weather."""
    else:
        hijab_guideline = """5. Standard Styling (No Hijab):
   - The client has NOT requested a hijab or headscarf.
   - Do NOT include any hijab, headscarf, or turban in any outfit."""

    prompt = f"""You are AURA, an elite luxury personal stylist and fashion critic.
{capsule_guidance}
Use ONLY items from the numbered wardrobe inventory below.

CONTEXT:
Occasion: {context['occasion']['title']} ({context['occasion']['key']}) - {context['occasion']['description']}
Desired Style: {', '.join(context['occasion']['desired_aesthetic'])}
Inappropriate for Occasion: {', '.join(context['occasion']['strictly_avoid'])}
Weather: {context['weather']['city']} | {context['weather']['temperature_celsius']}°C (Feels like {context['weather']['feels_like']}°C), {context['weather']['condition']}, Humidity: {context['weather']['humidity_percent']}% ({context['weather']['fashion_weather_advice']})
Client Profile: {context['client_profile']['skin_undertone']} undertone, {context['client_profile']['style_persona']} persona, {context['client_profile']['preferred_fit']} fit.

CLIENT WARDROBE INVENTORY:
{inventory_text}

AI STYLIST CORE REASONING GUIDELINES:
1. Complete Ensemble Evaluation & Whole-Outfit Harmony:
   - Every outfit must be judged as an integrated, complete ensemble (top + bottom + footwear, OR one-piece dress/gown + footwear).
   - Footwear Synergy: Footwear is a crucial stylistic anchor. You MUST intentionally choose footwear from the client's wardrobe that elevates and completes each look (e.g. heels/elevated shoes for party/date/formal; sneakers or flats for casual off-duty). Never omit footwear if shoes exist in the wardrobe.
   - Occasion Appropriateness:
     * Wedding / Gala: Formal evening wear or festive ethnic (gowns, festive dresses, ceremonial elegance). Never recommend casual daytime tees, work shirts, or sneakers.
     * Party & Night Out: Statement glamour, chic silhouettes, cocktail dresses, elevated footwear. Never recommend daytime office shirts or gym wear.
     * Office / Work: Polished, structured separates (tailored trousers, blouses, collared shirts). Never recommend off-shoulder cuts, evening ballgowns, or distressed loungewear.
     * Date Night & Fine Dining: Romantic, alluring, and polished. Prominently feature minimal midi dresses, slip dresses, chic frocks, or elevated tops with sleek dark trousers/jeans, paired with heels or sleek flats. (Reserve heavy floor-length ballgowns for galas; avoid sloppy loungewear or athletic sneakers).
     * Beach / Resort & Vacation: Breezy, sun-ready, and effortlessly stylish. Prominently feature lightweight minimal sundresses, airy midi dresses, flowy cotton/linen frocks, and breathable separates paired with stylish sandals or flats. (Never suggest heavy winter coats, dark stiff suits, or heavy formal ballgowns).
     * Casual Weekend & Brunch: Effortless, comfortable off-duty style (breezy day dresses, casual frocks, tees, casual shirts, denim, sneakers, flats). Never recommend floor-length gala gowns.
   - Versatile Dresses & Frocks Intelligence (High Priority):
     * DRESSES AND FROCKS ARE NOT ONLY FOR WEDDINGS OR RED CARPETS!
     * Minimal, flowy, and breathable dresses (such as minimal midi dresses, slip dresses, cotton frocks, sundresses, and shirt dresses) are quintessential first-choice looks for:
       - Beach / Resort: Breezy lightweight sundresses, minimal cotton frocks, and airy midi dresses paired with sandals or flats.
       - Date Night & Fine Dining: Minimal midi dresses, flattering slip dresses, and elegant frocks paired with heels or sleek flats.
       - Brunches & Day Outings: Casual daytime frocks, breezy sundresses, and relaxed day dresses.
     * When the client's wardrobe contains dresses or frocks, prioritize them as top-ranking looks for Beach/Resort, Date Night, Dinner, and Brunch alongside elevated separates!
   - Quality Over Filler: Only recommend combinations that genuinely work. If the wardrobe realistically supports 2, 3, or 4 great looks, return only those strong, authentic looks.
   - Structural Sanity: Multi-piece looks must have coordinated tops, bottoms, and footwear. A one-piece dress/gown pairs with footwear (never combine a dress with trousers or another dress). Never combine multiple bottoms or multiple shoes.

2. Realistic Weather & Fabric Physics:
   - Current weather is {context['weather']['temperature_celsius']}°C (Feels like {context['weather']['feels_like']}°C), {context['weather']['condition']}, Humidity: {context['weather']['humidity_percent']}%.
   - In warm/hot weather (>24°C), prioritize breathable fabrics (cotton, linen, lightweight weaves). Strictly avoid heavy winter outerwear and thick knits.
   - In cold weather (<15°C), require appropriate layering and warm textures.

3. Rich 3-Factor Stylist Reasoning:
   - In `styling_reason`, provide a crisp 2-sentence analysis (approx 25-35 words) explicitly explaining:
     (a) Why this silhouette and footwear combination excel for {context['occasion']['title']}.
     (b) How the fabrics ensure comfort in {context['weather']['city']}'s current weather ({context['weather']['temperature_celsius']}°C, {context['weather']['humidity_percent']}% humidity).
     (c) How the color palette flatters their {context['client_profile']['skin_undertone']} skin undertone.
   - STRICT GROUNDING: Mention ONLY items that are actually included in that outfit. Do NOT reference items that were not selected.

4. Actionable Wardrobe Gap & Shopping Advice:
   - In `wardrobe_gap_advice`, provide a concise, actionable 30-45 word stylist recommendation.
   - Note any limitations and recommend 1-2 specific missing investment staples (fabrics, cuts, colors suited to {context['client_profile']['skin_undertone']} undertone and current weather) to unlock more versatility.

{hijab_guideline}
6. Item References: In `item_ids`, provide the assigned inventory numbers (e.g. [1, 6]) matching the numbered inventory list above.

OUTPUT STRICTLY VALID JSON:
{{
  "outfits": [
    {{
      "outfit_id": "outfit_1",
      "item_ids": [1, 6],
      "title": "Editorial 2-3 Word Title",
      "styling_reason": "Crisp 2-sentence stylist note explaining occasion silhouette, footwear match, weather/fabric breathability for {context['weather']['temperature_celsius']}°C, and color harmony with {context['client_profile']['skin_undertone']} undertone.",
      "occasion_fit": 95,
      "weather_fit": 92,
      "color_harmony": 94,
      "style_fit": 93,
      "overall_score": 94
    }}
  ],
  "wardrobe_gap_advice": "Concise 30-45 word stylist advice detailing wardrobe strengths and 1-2 missing key investment staples for this occasion."
}}"""
    return prompt


# Primary and fallback Groq LLM models verified on the active account
PRIMARY_GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
FALLBACK_GROQ_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "groq/compound-mini")
TERTIARY_GROQ_MODEL = "groq/compound"


def parse_llm_json(raw_text: str) -> dict:
    """Parses JSON response safely, handling codeblocks and preamble."""
    import re
    cleaned = raw_text.strip()
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def generate_ai_outfits(prompt: str) -> tuple[list[dict], Optional[str]]:
    """
    Calls Groq LLM to generate candidate outfits.
    Returns (raw_candidates, wardrobe_gap_advice).
    """
    raw_candidates = []
    wardrobe_gap_advice = None
    system_message = {"role": "system", "content": "You are AURA, an elite luxury personal stylist and fashion critic. You always respond in valid JSON format only."}

    # Attempt 1: Primary Model (qwen/qwen3.8-27b)
    try:
        completion = groq_client.chat.completions.create(
            model=PRIMARY_GROQ_MODEL,
            messages=[system_message, {"role": "user", "content": prompt}],
            temperature=0.35,
            max_completion_tokens=650,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content.strip()
        parsed = parse_llm_json(content)

        if isinstance(parsed, dict):
            raw_candidates = parsed.get("outfits", [])
            wardrobe_gap_advice = parsed.get("wardrobe_gap_advice")
        elif isinstance(parsed, list):
            raw_candidates = parsed
    except Exception as e:
        logger.warning(f"Primary Groq AI Stylist notice with {PRIMARY_GROQ_MODEL}: {e}")
        # Attempt 2: Fallback Model (groq/compound-mini)
        try:
            retry_completion = groq_client.chat.completions.create(
                model=FALLBACK_GROQ_MODEL,
                messages=[system_message, {"role": "user", "content": prompt}],
                temperature=0.35,
                max_completion_tokens=700,
                response_format={"type": "json_object"}
            )
            retry_content = retry_completion.choices[0].message.content.strip()
            retry_parsed = parse_llm_json(retry_content)
            if isinstance(retry_parsed, dict):
                raw_candidates = retry_parsed.get("outfits", [])
                wardrobe_gap_advice = retry_parsed.get("wardrobe_gap_advice")
            elif isinstance(retry_parsed, list):
                raw_candidates = retry_parsed
        except Exception as retry_err:
            logger.warning(f"Fallback Groq AI Stylist notice with {FALLBACK_GROQ_MODEL}: {retry_err}")
            # Attempt 3: Tertiary Model (groq/compound)
            try:
                t_completion = groq_client.chat.completions.create(
                    model=TERTIARY_GROQ_MODEL,
                    messages=[system_message, {"role": "user", "content": prompt}],
                    temperature=0.35,
                    max_completion_tokens=700,
                    response_format={"type": "json_object"}
                )
                t_content = t_completion.choices[0].message.content.strip()
                t_parsed = parse_llm_json(t_content)
                if isinstance(t_parsed, dict):
                    raw_candidates = t_parsed.get("outfits", [])
                    wardrobe_gap_advice = t_parsed.get("wardrobe_gap_advice")
                elif isinstance(t_parsed, list):
                    raw_candidates = t_parsed
            except Exception as t_err:
                logger.error(f"Tertiary Groq AI Stylist notice with {TERTIARY_GROQ_MODEL}: {t_err}")

    return raw_candidates, wardrobe_gap_advice


def validate_ai_outfits(
    raw_outfits: list[dict],
    wardrobe_map: dict,
    feedback_data: dict,
    occasion_key: str,
    weather: dict,
    index_map: Optional[dict] = None,
    include_hijab: bool = False
) -> list[dict]:
    """
    Deterministic Safety & Validation Layer.
    Ensures zero hallucinated IDs, rejects never_wear items, and validates ensemble sanity.
    Supports both indexed numbers [1, 2] and canonical UUID strings.
    """
    valid_outfits = []
    never_wear_set = feedback_data.get("never_wear_items", set())
    occ_key = (occasion_key or "").strip().lower()

    # Check if client wardrobe contains any footwear
    user_has_footwear = any(
        any(s in (str(it.get("category", "")) + " " + str(it.get("subcategory", ""))).lower() for s in ["shoe", "footwear", "heel", "sneaker", "boot", "sandal", "loafer", "flat", "slingback"])
        for it in wardrobe_map.values()
        if str(it.get("id")) not in never_wear_set and not it.get("never_wear")
    )

    for idx, out in enumerate(raw_outfits):
        if not isinstance(out, dict):
            continue

        item_ids = out.get("item_ids") or out.get("items")
        if not item_ids or not isinstance(item_ids, list):
            continue

        # 1. Deduplicate item IDs within the outfit and map indexes to canonical UUIDs
        unique_item_ids = []
        seen_ids = set()
        for iid in item_ids:
            canonical_id = None
            if index_map:
                try:
                    int_id = int(str(iid).strip())
                    canonical_id = index_map.get(int_id)
                except (ValueError, TypeError):
                    pass
            if not canonical_id:
                canonical_id = str(iid).strip()

            if canonical_id and canonical_id not in seen_ids:
                seen_ids.add(canonical_id)
                unique_item_ids.append(canonical_id)

        # 2. Strict ID verification against real wardrobe & blacklist
        all_exist = True
        has_never_wear = False
        garments = []

        for iid in unique_item_ids:
            if iid not in wardrobe_map:
                all_exist = False
                break
            if iid in never_wear_set or wardrobe_map[iid].get("never_wear"):
                has_never_wear = True
                break
            garments.append(wardrobe_map[iid])

        if not all_exist or has_never_wear:
            continue

        # 3. Structural validation: reject outfits lacking essential components
        categories = [str(g.get("category", "")).lower() for g in garments]
        subcategories = [str(g.get("subcategory", "")).lower() for g in garments]
        combined_types = categories + subcategories
        combined_tags = " ".join(combined_types)

        # Count item roles
        has_one_piece = any(op in combined_tags for op in ["dress", "gown", "jumpsuit", "romper", "saree", "sari", "anarkali", "abaya"])
        has_top = any(t in combined_tags for t in ["shirt", "t-shirt", "tshirt", "top", "blouse", "polo", "kurta", "kurti", "sweater", "hoodie", "tank"])
        has_bottom = any(b in combined_tags for b in ["pant", "trouser", "jean", "skirt", "short", "cargo", "chino", "jogger", "palazzo"])
        has_shoe = any(s in combined_tags for s in ["shoe", "footwear", "heel", "sneaker", "boot", "sandal", "loafer", "flat", "slingback"])
        has_hijab = any(h in combined_tags for h in ["hijab", "headscarf", "turban", "scarf", "dupatta"])

        # Ensemble Completeness:
        # Multi-piece looks must have at least (top + bottom).
        # Standalone one-piece (dress, gown, jumpsuit, romper, saree, abaya) does not require separates.
        if not has_one_piece and (not has_top or not has_bottom):
            continue  # Incomplete: lacks either top or bottom

        # Footwear completeness:
        # If user owns footwear, every complete outfit MUST have a shoe intentionally selected by the AI.
        # We DO NOT auto-append arbitrary shoes from the wardrobe.
        if user_has_footwear and not has_shoe:
            continue  # AI did not select footwear; reject incomplete look

        # Physical sanity: Cannot wear multiple pairs of shoes
        footwear_count = sum(1 for c in categories if any(f in c for f in ["shoe", "footwear", "heel", "sneaker", "boot", "sandal", "loafer"]))
        if footwear_count > 1:
            continue

        # Physical sanity: Cannot wear multiple bottoms
        bottom_count = sum(1 for c in categories if any(b in c for b in ["bottom", "trouser", "pant", "jean", "skirt", "short"]))
        if bottom_count > 1:
            continue

        # Physical sanity: Cannot wear multiple distinct one-pieces
        one_piece_count = sum(1 for g in garments if any(op in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for op in ["dress", "gown", "jumpsuit", "romper", "saree", "sari", "anarkali", "abaya"]))
        if one_piece_count > 1:
            continue

        # Physical sanity: Cannot wear a one-piece dress/gown AND a bottom together (unless ethnic kurti)
        if has_one_piece and has_bottom and not any(k in combined_tags for k in ["kurta", "kurti", "tunic"]):
            continue

        # Physical sanity: Cannot wear multiple non-outerwear tops
        def is_outerwear_piece(g: dict) -> bool:
            c = (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower()
            return any(ow in c for ow in ["jacket", "blazer", "coat", "cardigan", "hoodie", "sweater", "shrug", "overshirt"])

        non_ow_tops = [g for g in garments if any(t in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for t in ["shirt", "t-shirt", "tshirt", "top", "blouse", "polo", "tank", "tee"]) and not is_outerwear_piece(g)]
        if len(non_ow_tops) > 1:
            continue

        # Cannot have multiple distinct hijabs
        hijab_count = sum(1 for g in garments if any(h in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for h in ["hijab", "headscarf", "turban"]))
        if hijab_count > 1:
            continue

        # Strict user preference enforcement for hijab
        if not include_hijab and has_hijab:
            continue  # User did not request hijab; strictly reject
        if include_hijab and not has_hijab:
            continue  # User requested hijab; strictly require
        if include_hijab and any(w in combined_tags for w in ["off-shoulder", "off shoulder", "strapless", "backless", "tube"]):
            continue  # Modest styling requires covered shoulders

        # Extreme Weather & Fabric sanity guardrail
        temp = float(weather.get("temperature", 22))
        feels_like = float(weather.get("feels_like", temp))
        fabrics = [str(g.get("fabric", "")).lower() for g in garments]

        # In warm/hot weather (temp >= 28°C or feels_like >= 30°C), strictly reject heavy winter outerwear
        if temp >= 28.0 or feels_like >= 30.0:
            heavy_winter_fabrics = ["fleece", "heavy knit", "flannel", "down", "shearling", "puffer"]
            if any(any(hf in f for hf in heavy_winter_fabrics) for f in fabrics):
                continue

        # AI Evaluated Scores
        try:
            overall_score = float(out.get("overall_score", 90.0))
        except (ValueError, TypeError):
            overall_score = 90.0
        overall_score = round(min(99.0, max(50.0, overall_score)), 1)

        def get_subscore(key: str, default: float) -> float:
            try:
                val = float(out.get(key, default))
                return round(min(99.0, max(50.0, val)), 1)
            except (ValueError, TypeError):
                return default

        valid_outfits.append({
            "title": out.get("title") or f"Curated Look #{idx + 1}",
            "item_ids": unique_item_ids,
            "styling_reason": out.get("styling_reason") or out.get("reasoning") or "Harmonious ensemble curated for you.",
            "overall_score": overall_score,
            "occasion_fit": get_subscore("occasion_fit", overall_score),
            "weather_fit": get_subscore("weather_fit", overall_score),
            "color_harmony": get_subscore("color_harmony", overall_score),
            "style_fit": get_subscore("style_fit", overall_score),
        })

    return valid_outfits


def calculate_jaccard_similarity(ids_a: list[str], ids_b: list[str]) -> float:
    """Calculates Jaccard overlap between two item sets."""
    set_a, set_b = set(ids_a), set(ids_b)
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return intersection / union if union > 0 else 0.0


def deduplicate_outfits(valid_outfits: list[dict], threshold: float = 0.85, top_n: int = 5) -> list[dict]:
    """Filters out identical outfits while preserving up to top_n distinct ensemble options."""
    sorted_outfits = sorted(valid_outfits, key=lambda x: x["overall_score"], reverse=True)
    selected = []

    for out in sorted_outfits:
        is_duplicate = False
        out_set = set(out["item_ids"])
        for s in selected:
            if out_set == set(s["item_ids"]):
                is_duplicate = True
                break
            if calculate_jaccard_similarity(out["item_ids"], s["item_ids"]) >= threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            selected.append(out)
        if len(selected) >= top_n:
            break

    # If selected is still fewer than top_n, add non-exact-duplicate outfits from sorted_outfits
    if len(selected) < top_n:
        for out in sorted_outfits:
            out_set = set(out["item_ids"])
            if not any(out_set == set(s["item_ids"]) for s in selected):
                selected.append(out)
            if len(selected) >= top_n:
                break

    return selected


def generate_fallback_gap_advice(occasion_key: str, weather: dict, profile: dict, wardrobe: list[dict]) -> str:
    """
    Synthesizes an honest, dynamic stylist consultation if the LLM response omitted or truncated wardrobe_gap_advice.
    """
    undertone = profile.get("skin_tone", "neutral")
    temp = weather.get("temperature", 25)
    shoes = [w for w in wardrobe if any(k in (str(w.get("category", "")) + str(w.get("subcategory", ""))).lower() for k in ["shoe", "heel", "sneaker", "boot", "sandal", "loafer"])]
    shoe_note = ""
    if len(shoes) <= 1:
        shoe_note = "Your current wardrobe relies heavily on a single pair of footwear. Introducing an alternate silhouette or finish will immediately multiply your pairing options. "

    occ_clean = (occasion_key or "your selected event").replace("_", " ").title()
    return (
        f"Your wardrobe provides foundational pieces for {occ_clean}. {shoe_note}"
        f"To expand your styling versatility for {temp}°C weather, consider investing in curated layering pieces "
        f"and tailored staples in fabrics and tones that enhance your {undertone} undertone."
    )


def synthesize_grounded_stylist_note(
    garments: list[dict],
    occasion_title: str,
    city: str,
    temp: float,
    undertone: str
) -> tuple[str, str]:
    """
    Deterministically crafts an editorial title and rich 3-factor stylist note
    grounded 100% in the exact metadata of the selected garments.
    Guarantees zero hallucination.
    """
    if not garments:
        return f"{occasion_title} Look", f"A coordinated ensemble curated for {occasion_title}."

    dresses = [g for g in garments if any(w in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for w in ["dress", "gown", "jumpsuit", "romper", "saree", "abaya"])]
    tops = [g for g in garments if any(w in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for w in ["shirt", "blouse", "top", "t-shirt", "kurta", "sweater", "hoodie"])]
    bottoms = [g for g in garments if any(w in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for w in ["trouser", "pant", "jean", "skirt", "short", "palazzo"])]
    shoes = [g for g in garments if any(w in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for w in ["heel", "slingback", "shoe", "sneaker", "boot", "sandal", "loafer", "flat"])]
    hijabs = [g for g in garments if any(w in (str(g.get("category", "")) + " " + str(g.get("subcategory", ""))).lower() for w in ["hijab", "headscarf", "turban"])]

    primary = dresses[0] if dresses else (tops[0] if tops else garments[0])
    p_color = (primary.get("color") or "").strip().title()
    p_subcat = (primary.get("subcategory") or primary.get("category") or "Piece").strip().title()
    p_style = primary.get("style") or "polished"
    p_fabric = primary.get("fabric") or "breathable fabric"

    title = f"{p_color} {p_subcat}" if len(f"{p_color} {p_subcat}") <= 26 else f"{p_color} {occasion_title.split()[0]} Look"

    shoe_desc = f"with {shoes[0].get('color', '').lower()} {shoes[0].get('subcategory') or shoes[0].get('category', 'footwear')}" if shoes else ""
    hijab_desc = f"and coordinated {hijabs[0].get('color', '').lower()} {hijabs[0].get('subcategory') or 'hijab'}" if hijabs else ""

    if dresses:
        note = (
            f"The {dresses[0].get('color', '').lower()} {dresses[0].get('subcategory') or 'dress'} creates an intentional, {p_style} silhouette {shoe_desc} {hijab_desc} for {occasion_title}. "
            f"Its {p_fabric} fabric offers comfortable breathability in {city}'s {temp}°C climate, while the {p_color.lower()} palette enriches your {undertone} undertone."
        )
    elif tops and bottoms:
        note = (
            f"The {tops[0].get('color', '').lower()} {tops[0].get('subcategory') or 'top'} paired with {bottoms[0].get('color', '').lower()} {bottoms[0].get('subcategory') or 'bottom'} {shoe_desc} {hijab_desc} delivers a refined, {p_style} balance for {occasion_title}. "
            f"Breathable {p_fabric} keeps you comfortable in {city}'s {temp}°C weather, with {p_color.lower()} complementing your {undertone} undertone."
        )
    else:
        garment_names = ", ".join(f"{g.get('color', '').lower()} {g.get('subcategory') or g.get('category')}" for g in garments)
        note = (
            f"This curated ensemble of {garment_names} provides a well-proportioned silhouette for {occasion_title}. "
            f"The fabric ensures comfort in {city}'s {temp}°C climate, while harmonizing with your {undertone} undertone."
        )

    return title, " ".join(note.split())


def generate_and_validate_grounded_reasoning(
    outfits: list[dict],
    wardrobe_map: dict,
    context: dict
) -> list[dict]:
    """
    Instant Grounding & Anti-Hallucination Guardrail:
    1. Takes the AI-generated titles and 3-factor styling reasons from Stage 1.
    2. Runs a deterministic check against all unselected items in the user's wardrobe.
    3. If any unselected item (e.g. mentioning denim when wearing a gown) is detected,
       or if the note is empty/short, instantly synthesizes a 100% grounded stylist note.
    4. Operates in memory in < 1ms with ZERO redundant LLM calls or token waste.
    """
    if not outfits:
        return []

    occasion_info = context.get("occasion", {})
    occasion_title = occasion_info.get("title", "Occasion")
    city = context.get("weather", {}).get("city", "Current City")
    temp = context.get("weather", {}).get("temperature_celsius", 22)
    undertone = context.get("client_profile", {}).get("skin_undertone", "neutral")

    grounded_outfits = []
    for idx, out in enumerate(outfits):
        garments = [wardrobe_map[iid] for iid in out["item_ids"] if iid in wardrobe_map]
        oid = out.get("outfit_id") or f"outfit_{idx + 1}"
        title = out.get("title") or f"{occasion_title} Ensemble"
        reason = out.get("styling_reason") or ""

        selected_ids = set(out["item_ids"])
        unselected_items = [it for iid, it in wardrobe_map.items() if iid not in selected_ids]
        selected_text = " ".join((str(g.get("category", "")) + " " + str(g.get("subcategory", "")) + " " + str(g.get("color", "")) + " " + str(g.get("fabric", ""))).lower() for g in garments)

        forbidden_terms = set()
        for un in unselected_items:
            un_cat = (un.get("category") or "").lower()
            un_sub = (un.get("subcategory") or "").lower()

            if any(d in un_cat or d in un_sub for d in ["jean", "denim"]):
                if not any(d in selected_text for d in ["jean", "denim"]):
                    forbidden_terms.update(["jean", "jeans", "denim"])

            if any(t in un_cat or t in un_sub for t in ["t-shirt", "tshirt", "tee"]):
                if not any(t in selected_text for t in ["t-shirt", "tshirt", "tee"]):
                    forbidden_terms.update(["t-shirt", "tshirt", "basic tee"])

            if any(s in un_cat or s in un_sub for s in ["sneaker"]):
                if not any(s in selected_text for s in ["sneaker"]):
                    forbidden_terms.update(["sneaker", "sneakers", "chunky sneakers"])

            if any(gw in un_sub for gw in ["gown", "evening gown"]):
                if not any(gw in selected_text for gw in ["gown"]):
                    forbidden_terms.update(["evening gown", "ballgown", "silk gown"])

            if any(tr in un_cat or tr in un_sub for tr in ["trouser", "pant"]):
                if not any(tr in selected_text for tr in ["trouser", "pant", "bottom"]):
                    forbidden_terms.update(["trouser", "trousers", "slacks"])

            if any(h in un_cat or h in un_sub for h in ["hijab", "headscarf"]):
                if not any(h in selected_text for h in ["hijab", "headscarf"]):
                    forbidden_terms.update(["hijab", "headscarf"])

        combined_output_text = (f"{title} {reason}").lower()
        has_hallucination = False
        hallucinated_term = ""
        import re
        for term in forbidden_terms:
            if re.search(r'\b' + re.escape(term) + r'\b', combined_output_text):
                has_hallucination = True
                hallucinated_term = term
                break

        if has_hallucination or not reason or len(reason.strip()) < 25:
            logger.info(f"Anti-hallucination guardrail active for {oid}: unselected term '{hallucinated_term}' detected. Synthesizing 100% grounded note.")
            syn_title, syn_note = synthesize_grounded_stylist_note(garments, occasion_title, city, temp, undertone)
            title = syn_title
            reason = syn_note

        out["title"] = title
        out["styling_reason"] = reason
        grounded_outfits.append(out)

    return grounded_outfits


def rank_ai_outfits(deduped_outfits: list[dict], top_n: int = 5) -> list[dict]:
    """Ranks validated and deduplicated outfits by AI overall_score."""
    sorted_outfits = sorted(deduped_outfits, key=lambda x: x["overall_score"], reverse=True)
    return sorted_outfits[:top_n]


def hydrate_outfits_for_frontend(
    ranked_outfits: list[dict],
    wardrobe_map: dict,
    wardrobe_gap_advice: Optional[str] = None
) -> list[dict]:
    """
    Transforms validated AI outfits into the backward-compatible schema
    expected by the frontend UI, Flat-Lay modal, and outfit history storage.
    """
    hydrated = []
    for out in ranked_outfits:
        items_full = [wardrobe_map[iid] for iid in out["item_ids"] if iid in wardrobe_map]
        hydrated.append({
            "title": out["title"],
            "items": items_full,
            "reasoning": out["styling_reason"],
            "total_score": out["overall_score"],
            "occasion_fit": out.get("occasion_fit", 92),
            "weather_fit": out.get("weather_fit", 90),
            "color_harmony": out.get("color_harmony", 94),
            "style_fit": out.get("style_fit", 91),
            "wardrobe_gap_advice": wardrobe_gap_advice,
        })
    return hydrated


def get_ai_recommendations(
    user_id: str,
    occasion: str,
    city: str,
    skin_undertone: str,
    top_n: int = 5,
    include_hijab: bool = False,
    force_refresh: bool = False
) -> list[dict]:
    """
    Main entry point for the True AI Personal Stylist.
    Orchestrates:
    Wardrobe + Weather + Profile + Feedback (parallelized) -> Structured Context -> Groq LLM -> Validation -> Deduplication -> Grounded Reasoning -> Hydration.
    Includes in-memory caching for instant 0ms responses on repeated occasion selections.
    """
    now = time.time()
    cache_key = f"{user_id}:{str(occasion).lower().strip()}:{str(city).lower().strip()}:{str(skin_undertone).lower().strip()}:{bool(include_hijab)}"

    if not force_refresh:
        cached = _AI_RECOMMENDATIONS_CACHE.get(cache_key)
        if cached and (now - cached[0]) < RECOM_CACHE_TTL:
            logger.info(f"AI Stylist cache HIT for key '{cache_key}' (age: {now - cached[0]:.1f}s)")
            return cached[1]

    # Parallel asynchronous data fetching for wardrobe, weather, profile, and feedback
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        f_wardrobe = executor.submit(get_user_wardrobe_items, user_id)
        f_weather = executor.submit(get_weather, city) if city else None
        f_profile = executor.submit(get_user_profile, user_id)
        f_feedback = executor.submit(get_user_feedback, user_id)

        wardrobe = f_wardrobe.result()
        if not wardrobe:
            logger.info(f"User {user_id} has empty wardrobe.")
            return []

        weather = f_weather.result() if f_weather else {"temperature": 22, "condition": "Clear", "humidity": 50}
        profile = f_profile.result()
        feedback_data = f_feedback.result()

    wardrobe_map = {str(it["id"]): it for it in wardrobe}
    context = build_stylist_context(wardrobe, occasion, weather, profile, feedback_data, include_hijab=include_hijab)
    prompt = build_outfit_prompt(context, top_n=top_n)
    index_map = context.get("index_map", {})

    raw_candidates, wardrobe_gap_advice = generate_ai_outfits(prompt)

    if not wardrobe_gap_advice or len(str(wardrobe_gap_advice).strip()) < 20:
        wardrobe_gap_advice = generate_fallback_gap_advice(occasion, weather, profile, wardrobe)

    valid_outfits = validate_ai_outfits(raw_candidates, wardrobe_map, feedback_data, occasion, weather, index_map=index_map, include_hijab=include_hijab)

    deduped_outfits = deduplicate_outfits(valid_outfits, threshold=0.85, top_n=top_n)

    if not deduped_outfits:
        logger.warning(f"AI Stylist found no valid outfits satisfying constraints for user {user_id} on occasion '{occasion}'.")

    ranked_outfits = rank_ai_outfits(deduped_outfits, top_n=top_n)

    # Grounded reasoning & anti-hallucination verification
    grounded_outfits = generate_and_validate_grounded_reasoning(ranked_outfits, wardrobe_map, context)

    final_outfits = hydrate_outfits_for_frontend(grounded_outfits, wardrobe_map, wardrobe_gap_advice)

    if final_outfits:
        _AI_RECOMMENDATIONS_CACHE[cache_key] = (now, final_outfits)

    logger.info(f"AI Stylist generated {len(final_outfits)} verified outfits for user {user_id} (Occasion: {occasion}).")
    return final_outfits
