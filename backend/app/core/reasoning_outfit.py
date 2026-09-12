import json
from groq import Groq
from app.core.config import settings

groq_client = Groq(api_key=settings.groq_api_key)

BATCH_REASONING_PROMPT = """You are an elite luxury personal stylist for a high-end fashion platform.
The user wants outfit recommendations specifically for the occasion: "{occasion}".

Context:
Occasion: {occasion}
Weather: {weather_description}
Skin Undertone: {skin_undertone}

For each outfit ensemble below, provide:
1. "title": A sophisticated, catchy 2-3 word editorial title strictly suited for "{occasion}" (e.g. for Party: "Midnight Glamour", "Electric Chic", "After-Hours Edge", "Velvet Dusk"; for Office: "Executive Poise", "Modern Classic"; etc.). NEVER use words or concepts from other occasions (NEVER call a party look "Brunch Ready", "City Explorer", or "Casual Morning").
2. "reasoning": A 1-2 sentence stylist note explaining why this ensemble works specifically for {occasion}, highlighting color harmony with their {skin_undertone} undertone, silhouette balance, and {weather_description} climate. If an outfit includes casual pieces (like denim or sneakers), explain how the styling elevates it for {occasion}.

Outfits:
{outfits_text}

Output format: Return ONLY a valid JSON array of objects in this exact structure:
[
  {{"title": "Title 1", "reasoning": "Stylist note 1..."}},
  {{"title": "Title 2", "reasoning": "Stylist note 2..."}}
]
Do NOT include markdown backticks, conversational preamble, or explanations."""

FALLBACK_OCCASION_TITLES: dict = {
    "party": ["Midnight Glamour", "Cocktail Edge", "After-Hours Chic", "Night Out Statement", "Urban Soirée"],
    "office": ["Executive Poise", "Tailored Minimalist", "Modern Professional", "Refined Classic", "Smart Contemporary"],
    "casual": ["Effortless Everyday", "Weekend Ease", "Laid-Back Minimalist", "Relaxed Modern", "Off-Duty Chic"],
    "wedding": ["Haute Celebration", "Regal Elegance", "Festive Grandeur", "Timeless Heritage", "Graceful Luxe"],
    "travel": ["Jetset Comfort", "Transit Luxe", "Wanderlust Chic", "Elevated Traveler", "Breezy Voyage"],
    "college": ["Campus Cool", "Varsity Minimalist", "Preppy Casual", "Urban Scholar", "Effortless Scholar"],
    "brunch": ["Sunlit Chic", "Cafe Minimalist", "Pastel Garden", "Breezy Social", "Al Fresco Elegance"],
    "vacation": ["Resort Luxe", "Coastal Breeze", "Golden Hour Ease", "Tropical Minimal", "Sun-Kissed Chic"],
    "interview": ["First Impression", "Commanding Poise", "Structured Ambition", "Polished Modern", "Power Dressing"],
    "festival": ["Cultural Grandeur", "Vibrant Heritage", "Festive Radiance", "Artisanal Elegance", "Celebration Luxe"],
    "gym": ["Athletic Performance", "Sleek Active", "Functional Edge", "High-Motion", "Core Studio"],
    "dinner": ["Fine Soirée", "Candlelit Glamour", "Sophisticated Dusk", "Intimate Luxe", "Sleek Evening"],
}


def add_reasoning_to_outfits(outfits: list[dict], occasion: str, weather: dict, skin_undertone: str) -> list[dict]:
    if not outfits:
        return []

    weather_description = f"{weather.get('temperature', 22)}°C, {weather.get('condition', 'Clear')}"
    occ_key = occasion.lower().strip() if occasion else "casual"
    fallback_titles = FALLBACK_OCCASION_TITLES.get(occ_key, FALLBACK_OCCASION_TITLES["casual"])

    outfit_lines = []
    for idx, outfit in enumerate(outfits, 1):
        items_desc = ", ".join(
            f"{it.get('color', '')} {it.get('category', '')} ({it.get('subcategory', '')}, {it.get('fabric', '')})"
            for it in outfit["items"]
        )
        outfit_lines.append(f"Outfit #{idx}: {items_desc}")

    prompt = BATCH_REASONING_PROMPT.format(
        occasion=occasion,
        weather_description=weather_description,
        skin_undertone=skin_undertone,
        outfits_text="\n".join(outfit_lines)
    )

    try:
        completion = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_completion_tokens=600,
        )
        raw_content = completion.choices[0].message.content.strip()

        if raw_content.startswith("```"):
            lines = raw_content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_content = "\n".join(lines).strip()

        parsed = json.loads(raw_content)
        if isinstance(parsed, list):
            for i, outfit in enumerate(outfits):
                if i < len(parsed):
                    entry = parsed[i]
                    if isinstance(entry, dict):
                        outfit["title"] = entry.get("title") or fallback_titles[i % len(fallback_titles)]
                        outfit["reasoning"] = entry.get("reasoning") or f"A coordinated {occasion} look tailored for {weather_description} and {skin_undertone} undertones."
                    elif isinstance(entry, str):
                        outfit["title"] = fallback_titles[i % len(fallback_titles)]
                        outfit["reasoning"] = entry.strip()
            return outfits
    except Exception as e:
        print(f"Batched reasoning generation notice: {e}")

    for i, outfit in enumerate(outfits):
        if not outfit.get("title"):
            outfit["title"] = fallback_titles[i % len(fallback_titles)]
        if not outfit.get("reasoning"):
            outfit["reasoning"] = f"A stylish, balanced ensemble curated for {occasion} in {weather_description} conditions."

    return outfits