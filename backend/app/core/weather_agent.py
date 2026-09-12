import time
import requests
from app.core.config import settings

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
OPENMETEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
OPENMETEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

# In-memory weather cache (15 min TTL) to eliminate redundant external HTTP latency
_WEATHER_CACHE: dict[str, tuple[float, dict]] = {}
WEATHER_CACHE_TTL = 900  # 15 minutes


def _get_fashion_insights(temp: float, humidity: int, condition: str) -> tuple[str, str, str]:
    c_lower = (condition or "").lower()
    
    if "rain" in c_lower or "drizzle" in c_lower or "thunderstorm" in c_lower:
        season_tag = "RAINY / WET WEATHER"
        fabrics = "Water-resistant nylon, treated cotton, quick-dry tech fabrics"
        advice = "Water-repellent trench or shell jacket. Avoid suede & raw leather."
    elif temp >= 32:
        season_tag = "HOT SUMMER"
        fabrics = "100% Pure Linen, light cotton poplin, seersucker, chambray"
        advice = "Relaxed breathable fits, airy short sleeves, UV protection sunglasses."
    elif temp >= 26:
        season_tag = "LIGHT SUMMER"
        fabrics = "Breathable cotton, linen blends, bamboo viscose"
        advice = "Lightweight polo, crisp shirts, airy chinos & breathable footwear."
    elif temp >= 20:
        season_tag = "MILD / PLEASANT"
        fabrics = "Oxford cotton, medium denim, fine merino wool"
        advice = "Versatile smart casual: light overshirt, knit cardigan, or crisp layer."
    elif temp >= 14:
        season_tag = "COOL TRANSITIONAL"
        fabrics = "Denim, corduroy, wool knits, flannel, leather"
        advice = "Smart layering: denim jacket, bomber, trench coat, or knit pullover."
    elif temp >= 8:
        season_tag = "CHILLY AUTUMN"
        fabrics = "Heavy wool, fleece, cashmere, leather, down blends"
        advice = "Structured overcoat, layered hoodies, thermal base and boots."
    else:
        season_tag = "COLD WINTER"
        fabrics = "Cashmere, down feathers, heavy wool, shearling"
        advice = "Heavy insulated coat, thermal base layer, scarves & winter boots."

    if humidity > 70 and temp >= 25:
        advice += " High humidity: choose relaxed, moisture-wicking weaves."

    return season_tag, fabrics, advice


CITY_ALIASES = {
    "antartica": "Antarctica",
    "antartika": "Antarctica",
    "antarctic": "Antarctica",
    "artic": "Arctic",
    "north pole": "North Pole",
    "south pole": "South Pole",
    "everest": "Mount Everest",
    "mt everest": "Mount Everest",
    "kashmir": "Srinagar",
    "leh ladakh": "Leh",
    "ladakh": "Leh",
    "banglore": "Bengaluru",
    "bangalore": "Bengaluru",
    "bombay": "Mumbai",
    "calcutta": "Kolkata",
    "gurgaon": "Gurugram",
}


def _build_city_candidates(city: str) -> list[str]:
    candidates = []
    clean = (city or "").strip()
    if not clean:
        return ["Noida"]

    # 1. Direct clean name
    candidates.append(clean)

    # 2. Check alias map
    c_low = clean.lower()
    if c_low in CITY_ALIASES:
        candidates.append(CITY_ALIASES[c_low])
    elif c_low.startswith("antart") or c_low.startswith("antarc"):
        candidates.append("Antarctica")
    elif c_low.startswith("artic") or c_low.startswith("arcti"):
        candidates.append("Arctic")

    # 3. Strip commas and common noise words (e.g. "Delhi NCR" -> "Delhi", "London UK" -> "London")
    tokens = [t.strip() for t in clean.replace(",", " ").split() if t.strip()]
    noise_words = {"ncr", "city", "district", "metro", "region", "area", "province", "india", "uk", "usa"}
    filtered_tokens = [t for t in tokens if t.lower() not in noise_words]
    if filtered_tokens:
        candidate_joined = " ".join(filtered_tokens)
        if candidate_joined not in candidates:
            candidates.append(candidate_joined)
        if filtered_tokens[0] not in candidates:
            candidates.append(filtered_tokens[0])
    elif tokens and tokens[0] not in candidates:
        candidates.append(tokens[0])

    return candidates


def get_weather(city: str) -> dict:
    """Fetches full temperature/condition/humidity/wind/fashion context for a city."""
    raw_city = (city or "Noida").strip()
    cache_key = raw_city.lower()
    now = time.time()

    # Instant cache hit (15 min TTL) -> 0ms latency
    if cache_key in _WEATHER_CACHE:
        cached_time, cached_val = _WEATHER_CACHE[cache_key]
        if now - cached_time < WEATHER_CACHE_TTL:
            return cached_val

    candidates = _build_city_candidates(raw_city)

    # 1. OpenWeatherMap (try candidates)
    if settings.openweather_api_key and settings.openweather_api_key != "placeholder-key":
        for cand in candidates:
            try:
                res = requests.get(
                    OPENWEATHER_BASE_URL,
                    params={"q": cand, "appid": settings.openweather_api_key, "units": "metric"},
                    timeout=4
                )
                if res.status_code == 200:
                    data = res.json()
                    temp = round(data["main"]["temp"], 1)
                    feels_like = round(data["main"]["feels_like"], 1)
                    temp_min = round(data["main"].get("temp_min", temp), 1)
                    temp_max = round(data["main"].get("temp_max", temp), 1)
                    humidity = int(data["main"].get("humidity", 50))
                    pressure = int(data["main"].get("pressure", 1013))
                    wind_speed = round(data.get("wind", {}).get("speed", 0) * 3.6, 1)  # m/s -> km/h
                    visibility_km = round(data.get("visibility", 10000) / 1000, 1)
                    condition = data["weather"][0]["main"]
                    description = data["weather"][0]["description"].title()

                    season_tag, fabrics, advice = _get_fashion_insights(temp, humidity, condition)

                    result = {
                        "city": data.get("name", cand),
                        "temperature": temp,
                        "feels_like": feels_like,
                        "temp_min": temp_min,
                        "temp_max": temp_max,
                        "humidity": humidity,
                        "pressure": pressure,
                        "wind_speed": wind_speed,
                        "visibility_km": visibility_km,
                        "condition": condition,
                        "description": description,
                        "season_tag": season_tag,
                        "fabrics_recommended": fabrics,
                        "styling_advice": advice,
                    }
                    _WEATHER_CACHE[cache_key] = (now, result)
                    return result
            except Exception as e:
                print(f"OpenWeather fetch failed for {cand}: {e}")

    # 2. Open-Meteo fallback (free, no key, try candidates)
    for cand in candidates:
        try:
            geo_res = requests.get(OPENMETEO_GEO_URL, params={"name": cand, "count": 1, "language": "en", "format": "json"}, timeout=4)
            if geo_res.status_code == 200 and geo_res.json().get("results"):
                geo = geo_res.json()["results"][0]
                w_res = requests.get(
                    OPENMETEO_WEATHER_URL,
                    params={
                        "latitude": geo["latitude"],
                        "longitude": geo["longitude"],
                        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure",
                        "daily": "temperature_2m_max,temperature_2m_min",
                        "timezone": "auto"
                    },
                    timeout=4
                )
                if w_res.status_code == 200:
                    curr = w_res.json().get("current", {})
                    daily = w_res.json().get("daily", {})
                    wcode = curr.get("weather_code", 0)
                    cond = "Clear" if wcode == 0 else ("Cloudy" if wcode in [1, 2, 3] else ("Rain" if wcode in [51, 53, 55, 61, 63, 65, 80, 81] else "Overcast"))

                    temp = round(curr.get("temperature_2m", 26.0), 1)
                    feels_like = round(curr.get("apparent_temperature", 26.0), 1)
                    humidity = int(curr.get("relative_humidity_2m", 55))
                    wind_speed = round(curr.get("wind_speed_10m", 10.0), 1)
                    pressure = int(curr.get("surface_pressure", 1013))
                    temp_max = round(daily.get("temperature_2m_max", [temp])[0], 1)
                    temp_min = round(daily.get("temperature_2m_min", [temp])[0], 1)

                    season_tag, fabrics, advice = _get_fashion_insights(temp, humidity, cond)

                    result = {
                        "city": geo.get("name", cand),
                        "temperature": temp,
                        "feels_like": feels_like,
                        "temp_min": temp_min,
                        "temp_max": temp_max,
                        "humidity": humidity,
                        "pressure": pressure,
                        "wind_speed": wind_speed,
                        "visibility_km": 10.0,
                        "condition": cond,
                        "description": cond,
                        "season_tag": season_tag,
                        "fabrics_recommended": fabrics,
                        "styling_advice": advice,
                    }
                    _WEATHER_CACHE[cache_key] = (now, result)
                    return result
        except Exception as e:
            print(f"Open-Meteo fetch failed for {cand}: {e}")

    # 3. Intelligent climate-aware fallback
    c_check = raw_city.lower()
    if any(k in c_check for k in ["antarct", "antart", "polar", "south pole"]):
        fb_temp = -45.0
        fb_feels = -52.0
        fb_cond = "Freezing Overcast"
        fb_humidity = 90
    elif any(k in c_check for k in ["arctic", "north pole", "siberia", "alaska", "everest"]):
        fb_temp = -25.0
        fb_feels = -32.0
        fb_cond = "Subzero Snow"
        fb_humidity = 85
    elif any(k in c_check for k in ["leh", "ladakh", "kashmir", "gulmarg", "manali", "shimla"]):
        fb_temp = 5.0
        fb_feels = 3.0
        fb_cond = "Chilly Mountain Air"
        fb_humidity = 60
    else:
        fb_temp = 27.5
        fb_feels = 28.0
        fb_cond = "Clear"
        fb_humidity = 58

    season_tag, fabrics, advice = _get_fashion_insights(fb_temp, fb_humidity, fb_cond)
    result = {
        "city": raw_city,
        "temperature": fb_temp,
        "feels_like": fb_feels,
        "temp_min": fb_temp - 3.0,
        "temp_max": fb_temp + 3.0,
        "humidity": fb_humidity,
        "pressure": 1012,
        "wind_speed": 25.0 if fb_temp < 0 else 12.0,
        "visibility_km": 5.0 if fb_temp < 0 else 10.0,
        "condition": fb_cond,
        "description": fb_cond,
        "season_tag": season_tag,
        "fabrics_recommended": fabrics,
        "styling_advice": advice,
    }
    _WEATHER_CACHE[cache_key] = (now, result)
    return result