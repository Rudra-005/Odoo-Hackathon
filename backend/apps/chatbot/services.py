"""
Chatbot service — uses Groq API (free tier, fast).
"""
from groq import Groq
from django.conf import settings
from .context import get_fleet_context

SYSTEM_PROMPT = """You are FleetBot, an intelligent AI assistant for TransitOps ERP — an enterprise Transport Management System.

You help fleet managers, dispatchers, and operations staff by:
- Answering questions about vehicles, drivers, trips, maintenance, expenses, and fuel
- Providing insights from live fleet data injected below
- Explaining how to use the system
- Giving operational recommendations

Rules:
- Be concise and professional
- Use the live data provided to give accurate, specific answers
- If asked about something not in the data, say so clearly
- Format numbers with commas and currency with ₹ symbol
- For lists, use bullet points
- Never make up data that isn't in the context

{fleet_context}
"""


def get_gemini_response(message: str, history: list) -> str:
    client = Groq(api_key=settings.GEMINI_API_KEY)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(fleet_context=get_fleet_context())}
    ]

    for msg in history:
        messages.append({
            "role": "assistant" if msg.get("role") == "assistant" else "user",
            "content": msg.get("content", "")
        })

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1024,
    )
    return response.choices[0].message.content
