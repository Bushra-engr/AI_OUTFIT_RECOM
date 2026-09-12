from app.core.recom_engine import get_recommendations

result = get_recommendations(
    user_id="edcd5cf9-bb30-4b46-b7c3-687de5d7123f",
    occasion="office",
    city="Noida",
    skin_undertone="warm"
)
print(result)