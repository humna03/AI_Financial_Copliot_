from typing import List, Optional

from app.services.copilot_context import CopilotContext

# Human-readable label + explicit script/behavior instruction per detected
# language. Keeping this as data (rather than branching prose all over the
# prompt builder) is what lets step 4's system instruction stay a single
# source of truth and stay easy to extend with another language later.
_LANGUAGE_INSTRUCTIONS = {
    "en": (
        "Respond in natural, conversational English."
    ),
    "roman-ur": (
        "Respond in natural, conversational Roman Urdu — Urdu written in "
        "Latin/English characters, NOT Urdu script. Write the way Pakistani "
        "users actually type to each other (e.g. \"Aap apne unnecessary "
        "expenses thore kam kar sakte hain\"), not a stiff word-for-word "
        "translation of English. Keep common financial terms such as "
        "budget, savings, income, expenses, investment, and financial "
        "score in English where that reads naturally, since that's how "
        "Roman Urdu speakers normally use them."
    ),
    "ur": (
        "Respond in natural, conversational Urdu script (Perso-Arabic "
        "script), not Roman Urdu and not English. Write fluent, idiomatic "
        "Urdu, not a literal machine-translated sentence. You may keep "
        "common financial terms such as بجٹ، بچت، آمدنی، اخراجات in Urdu or "
        "in their commonly used form, whichever reads more naturally."
    ),
}

_SHARED_LANGUAGE_RULES = (
    "Always respond in the same language and writing script the user used "
    "in their latest message, never the application's interface language. "
    "Never convert Roman Urdu into Urdu script, and never convert Urdu "
    "script into Roman Urdu, unless the user explicitly asks for that. "
    "Never switch to English unless the user's latest message is in "
    "English or they explicitly ask for an English answer. If the user's "
    "latest message mixes English and Roman Urdu, respond naturally in "
    "that same mixed, Roman-Urdu-dominant style rather than picking pure "
    "English or pure Urdu script. Do not mention language detection, or "
    "that you are following language instructions, to the user."
)


def _format_history(history: Optional[List[dict]]) -> str:
    """Renders prior turns as a simple transcript so the model has real
    multi-turn context (e.g. resolving "is mein se" back to an income
    mentioned earlier), without impersonating a different chat format."""
    if not history:
        return "(no earlier messages in this conversation)"

    lines = []
    for turn in history:
        role = turn.get("role") if isinstance(turn, dict) else getattr(turn, "role", None)
        content = turn.get("content") if isinstance(turn, dict) else getattr(turn, "content", "")
        speaker = "User" if role == "user" else "Assistant"
        lines.append(f"{speaker}: {content}")
    return "\n".join(lines)


def build_copilot_prompt(
    context: CopilotContext,
    question: str,
    history: Optional[List[dict]] = None,
    detected_language: Optional[str] = None,
) -> str:
    """
    Constructs the prompt for Gemini combining the assembled financial
    context, the recent conversation history, the user's current question,
    and explicit language instructions.

    `detected_language` is the language actually detected from the user's
    CURRENT message (see app.services.language_detect) — "en", "roman-ur",
    or "ur". It is intentionally independent from `context.language`,
    which is only the account's stored UI preference and is not a reliable
    signal of which language any single message is written in.
    """
    context_str = context.to_prompt_context_string()
    language_key = detected_language if detected_language in _LANGUAGE_INSTRUCTIONS else context.language
    lang_instruction = _LANGUAGE_INSTRUCTIONS.get(language_key, _LANGUAGE_INSTRUCTIONS["en"])
    history_str = _format_history(history)

    prompt = f"""You are an AI Financial Copilot for users in Pakistan.
You provide personal, data-aware financial advice grounded in the user's actual financial numbers.
You do not calculate or modify the financial health score, and you never modify financial records.

Language instructions:
{_SHARED_LANGUAGE_RULES}
For this specific reply: {lang_instruction}

User Financial Context:
{context_str}

Conversation so far:
{history_str}

User's Current Question:
{question}

Instructions:
1. Answer the user's current question directly, using the conversation above for context (e.g. resolve references like "it", "this amount", or "is mein se" back to what was discussed earlier) and the provided financial context.
2. Keep the advice practical, concise, and helpful.
3. If a needed piece of financial data is not present in the context above, say plainly that it isn't available yet rather than inventing a number.
4. Follow the language instructions above exactly.
"""
    return prompt
