"""
language_detect.py — detects which language/script a Copilot message is
actually written in (English, Roman Urdu, or Urdu script), independent of
the user's stored account/UI language preference.

Why this exists
----------------
Before this module, the Copilot always replied in whatever language the
user picked when their account was created (`User.language`, an "en"/"ur"
toggle). That UI preference has nothing to do with which language the user
actually types their question in on any given turn, so a user with an
English UI who typed a Roman Urdu question always got an English answer
back, and there was no way to answer in Roman Urdu at all.

This module inspects the literal text of the user's message (and, for
short/ambiguous messages, the recent conversation) and returns one of:

    "en"        — English
    "roman-ur"  — Urdu written in Latin script ("Roman Urdu")
    "ur"        — Urdu written in Urdu (Perso-Arabic) script

Detection strategy
-------------------
1. Any Urdu/Arabic-block character in the message is a near-certain signal
   of Urdu script — no other heuristic is needed once that's found.
2. Otherwise, tokenize Latin-script words and score them against a small
   hand-built lexicon of very common Roman Urdu function/grammar words
   (pronouns, verb helpers, question words, etc.) vs. common English
   function words. Financial vocabulary ("savings", "budget", "income"...)
   is deliberately excluded from both lists because it's used as a loanword
   in Roman Urdu financial conversation just as often as in English, so
   counting it would bias detection toward English on legitimate Roman
   Urdu messages like "Meri savings kitni hain?".
3. Short or genuinely ambiguous messages (e.g. "haan", "yes", "ok", or an
   empty match) fall back to the language of the preceding conversation
   turn when one is available, so a one-word reply like "haan" continues
   the Roman Urdu thread it was part of instead of bouncing to English.
4. If there's truly nothing to go on (first message, no signal at all),
   the caller's supplied default (typically the account's stored UI
   language) is used as a last resort.

This is intentionally a lightweight, dependency-free heuristic rather than
a statistical language-id model — it only has to distinguish three
possibilities in a narrow, finance-conversation domain, and keeping it
dependency-free avoids adding a new ML library to the backend for a
three-way classification.
"""

import re
from typing import Optional

# Any character in these Unicode blocks is Urdu/Arabic script.
_URDU_SCRIPT_RE = re.compile(
    r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]"
)

_WORD_RE = re.compile(r"[A-Za-z']+")

# Common Roman Urdu function words: pronouns, verb helpers, question words,
# postpositions, common everyday verbs/adjectives. Deliberately excludes
# finance loanwords (savings, budget, income, etc.) — see module docstring.
# Also deliberately excludes words that collide with common English
# spellings ("is", "the", "hi", "to", ...) even though they have valid
# Roman Urdu readings too, since there are plenty of unambiguous Roman
# Urdu markers below and keeping the collisions out avoids false positives
# on ordinary English sentences that happen to contain them.
_ROMAN_URDU_WORDS = frozenset(
    """
    mai main mein mera meri mere mujhe mujhay hum humara humari hume humein
    tum tumhara tumhari tumhein aap ap aapka aapki aapke aapko unka unki unke
    uska uski uske usko iska iski iske isko isse ismein ye yeh woh wo
    ka ki ke ko se par pe bhi na nahi nahin haan han ji
    hai hain hun hoon tha thi thay raha rahi rahe rha rhi rhe
    karna karo karein karain kar kre kro krna kren karun karoon karta karti
    karte kiya kya kyun kyu kaise kab kahan kidhar kitna kitni kitne
    kuch sabse zyada ziada bohat bahut thora thoda bilkul zaroor
    zaroorat zaruri chahiye chahye chahiyen acha acchi achi theek thik sahi
    galat bura buri paisa paise rupay rupaye rupya mahina mahine
    hafta abhi phir dobara wapis wapas idhar udhar yahan wahan lekin magar
    agar matlab samajh samajhna samjhao samjha samjhein
    batao bata bataye bataen madad zra zara jaldi bnao bana banau banaun
    krlo hoga hogi hogay honge chalega chalegi
    """.split()
)

# Common English function/grammar words — kept small and generic on
# purpose so ordinary financial nouns don't get counted as English signal.
_ENGLISH_WORDS = frozenset(
    """
    the a an is are was were am be been being have has had do does did
    can could should would will shall may might must i you he she it we
    they this that these those what why how when where who which
    please thanks thank hello hi yes no ok okay good bad and or but
    if then because so with without about for from to of in on at
    """.split()
)

_Language = str  # "en" | "roman-ur" | "ur"

# Below this many Latin words, a message is treated as too short to be
# confidently classified purely on its own content.
_SHORT_MESSAGE_WORD_COUNT = 2

# Minimum share of recognized Roman Urdu words (of all Latin words in the
# message) needed to call a longer message "dominantly" Roman Urdu.
_ROMAN_URDU_DOMINANCE_RATIO = 0.15


def contains_urdu_script(text: str) -> bool:
    """True if the text contains any Urdu/Arabic-script character."""
    return bool(_URDU_SCRIPT_RE.search(text))


def detect_language(text: str, previous_language: Optional[_Language] = None) -> _Language:
    """
    Detects whether `text` is English, Roman Urdu, or Urdu script.

    `previous_language` (one of "en" / "roman-ur" / "ur") is used only as a
    fallback for short or ambiguous messages that don't carry enough signal
    on their own — it never overrides a message with a clear signal of its
    own, per the "the actual user message must determine the response
    language" requirement.
    """
    stripped = (text or "").strip()
    if not stripped:
        return previous_language or "en"

    if contains_urdu_script(stripped):
        return "ur"

    words = [w.lower() for w in _WORD_RE.findall(stripped)]
    if not words:
        return previous_language or "en"

    roman_hits = sum(1 for w in words if w in _ROMAN_URDU_WORDS)
    english_hits = sum(1 for w in words if w in _ENGLISH_WORDS)

    if len(words) <= _SHORT_MESSAGE_WORD_COUNT:
        # Short/ambiguous message (e.g. "haan", "hi", "kyun?", "yes").
        if roman_hits and not english_hits:
            return "roman-ur"
        if english_hits and not roman_hits:
            return "en"
        if previous_language:
            return previous_language
        return "roman-ur" if roman_hits else "en"

    ratio = roman_hits / len(words)
    if roman_hits > 0 and ratio >= _ROMAN_URDU_DOMINANCE_RATIO:
        return "roman-ur"

    return "en"


def detect_conversation_language(
    history: list,
    current_question: str,
    fallback_language: Optional[_Language] = None,
) -> _Language:
    """
    Convenience wrapper for the Copilot route: looks at the most recent
    turn in `history` (a list of {"role", "content"} dicts, oldest first)
    to get a `previous_language` for the ambiguous-message fallback, then
    detects the language of `current_question` itself.
    """
    previous_language: Optional[_Language] = None
    for turn in reversed(history or []):
        content = (turn.get("content") if isinstance(turn, dict) else None) or ""
        if content.strip():
            previous_language = detect_language(content, previous_language=fallback_language)
            break
    return detect_language(current_question, previous_language=previous_language or fallback_language)
