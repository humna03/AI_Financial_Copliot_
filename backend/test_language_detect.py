"""
test_language_detect.py — unit tests for app.services.language_detect,
covering the English / Roman Urdu / Urdu-script detection heuristic and
its conversation-context fallback for short/ambiguous messages.

Run with:
    pytest test_language_detect.py -v
"""

import pytest

from app.services.language_detect import detect_conversation_language, detect_language


@pytest.mark.parametrize(
    "text,expected",
    [
        ("How much should I save every month?", "en"),
        ("How can I reduce my monthly expenses?", "en"),
        ("Can I afford to save more?", "en"),
        ("Mujhe har month kitni saving karni chahiye?", "roman-ur"),
        ("Budget kaise manage karun?", "roman-ur"),
        ("meri income kitni hai", "roman-ur"),
        ("mujhe saving karni chahiye?", "roman-ur"),
        ("mera budget bohat zyada ho gaya hai", "roman-ur"),
        ("expenses kam kaise karun?", "roman-ur"),
        ("mujhe samajh nahi aa raha", "roman-ur"),
        ("Mere monthly expenses bohat zyada hain, main unko kaise kam kar sakti hun?", "roman-ur"),
        ("Can you explain meri financial score itni low kyun hai?", "roman-ur"),
        ("Meri savings bohat low hain, what should I do?", "roman-ur"),
        ("مجھے ہر مہینے کتنی بچت کرنی چاہیے؟", "ur"),
        ("میری آمدنی کتنی ہے؟", "ur"),
        ("میرے ماہانہ اخراجات بہت زیادہ ہیں، میں انہیں کیسے کم کر سکتی ہوں؟", "ur"),
    ],
)
def test_detect_language_clear_signal(text, expected):
    assert detect_language(text) == expected


def test_mixed_message_with_english_words_still_reads_as_roman_urdu():
    # Per spec §2: financial loanwords + a couple of English words shouldn't
    # flip a dominantly-Roman-Urdu message to English.
    assert detect_language("Meri savings bohat low hain, what should I do?") == "roman-ur"


def test_urdu_script_takes_priority_even_with_latin_mixed_in():
    assert detect_language("آپ کی savings rate 25% ہے") == "ur"


@pytest.mark.parametrize(
    "text,previous,expected",
    [
        ("haan", "roman-ur", "roman-ur"),
        ("acha", "roman-ur", "roman-ur"),
        ("theek hai", "roman-ur", "roman-ur"),
        ("nahi", "roman-ur", "roman-ur"),
        ("kyun?", "roman-ur", "roman-ur"),
        ("جی", "ur", "ur"),
        ("hi", None, "en"),
        ("hello", None, "en"),
        ("yes", "roman-ur", "en"),  # unambiguous English signal wins outright
        ("what?", None, "en"),
    ],
)
def test_short_ambiguous_messages_use_context_fallback(text, previous, expected):
    assert detect_language(text, previous_language=previous) == expected


def test_empty_message_falls_back_to_previous_language():
    assert detect_language("   ", previous_language="roman-ur") == "roman-ur"
    assert detect_language("", previous_language=None) == "en"


def test_detect_conversation_language_uses_last_turn_for_context():
    history = [
        {"role": "user", "content": "Meri monthly income 150000 hai."},
        {"role": "assistant", "content": "Theek hai, bataiye aap kya jaanna chahte hain."},
    ]
    # "haan" alone is ambiguous; the last turn was Roman Urdu, so it should
    # continue Roman Urdu rather than bouncing to English.
    assert detect_conversation_language(history, "haan") == "roman-ur"


def test_detect_conversation_language_lets_current_message_override_history():
    history = [
        {"role": "user", "content": "Meri income 100000 hai."},
        {"role": "assistant", "content": "Theek hai."},
    ]
    # A clearly English current message wins even though history was Roman Urdu.
    assert detect_conversation_language(history, "How can I invest this amount?") == "en"


def test_detect_conversation_language_falls_back_to_account_language_when_no_history():
    # A genuinely ambiguous short message with no history falls back to the
    # account's stored language preference.
    assert detect_conversation_language([], "hmm", fallback_language="roman-ur") == "roman-ur"
    # "acha" has an unambiguous Roman Urdu signal on its own, so it wins
    # regardless of the account's fallback language:
    assert detect_conversation_language([], "acha", fallback_language="en") == "roman-ur"
