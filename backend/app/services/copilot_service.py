from app.services.copilot_context import CopilotContext


def build_copilot_prompt(context: CopilotContext, question: str) -> str:
    """
    Constructs the prompt for Gemini combining the assembled financial context,
    the user's question, and language instructions (English or Urdu).
    """
    context_str = context.to_prompt_context_string()
    lang_instruction = (
        "Respond in Urdu language."
        if context.language == "ur"
        else "Respond in English language."
    )

    prompt = f"""You are an AI Financial Copilot for users in Pakistan.
You provide personal, data-aware financial advice grounded in the user's actual financial numbers.
You do not calculate or modify the financial health score, and you never modify financial records.

User Financial Context:
{context_str}

User Question:
{question}

Instructions:
1. Answer the user's question directly using the provided financial context.
2. Keep the advice practical, concise, and helpful.
3. {lang_instruction}
"""
    return prompt
