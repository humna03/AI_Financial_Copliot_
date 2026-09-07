/**
 * messageLanguage.ts — shared client-side helper for the AI Copilot chat.
 *
 * The backend is the source of truth for which language a Copilot answer
 * is in (see `app/services/language_detect.py`): every `/copilot/ask`
 * response now includes a `language` field detected from the user's actual
 * message, one of "en" | "roman-ur" | "ur".
 *
 * This module has two jobs on top of that:
 *  1. A small mirror of the same heuristic, used ONLY to give the user's
 *     own chat bubble sensible text direction/font immediately when it's
 *     added to the thread — before the backend has answered — so the UI
 *     doesn't flash from LTR to RTL once the real response comes back.
 *  2. Rendering helpers (`directionFor`, `fontClassFor`) shared by every
 *     place in the UI that needs to turn a detected language into a
 *     `dir` attribute or font class, so that logic isn't duplicated
 *     across components.
 */

export type MessageLanguage = 'en' | 'roman-ur' | 'ur';

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const WORD_RE = /[A-Za-z']+/g;

// Kept intentionally small — this is only used for an optimistic first
// paint of the user's own message before the backend's detection (which
// also has conversation-history context) comes back.
const ROMAN_URDU_WORDS = new Set([
  'mai', 'main', 'mein', 'mera', 'meri', 'mere', 'mujhe', 'mujhay',
  'hum', 'humara', 'humari', 'tum', 'tumhara', 'tumhari', 'aap', 'ap',
  'aapka', 'aapki', 'aapke', 'aapko', 'iska', 'iski', 'iske', 'isko',
  'ka', 'ki', 'ke', 'ko', 'se', 'par', 'pe', 'bhi', 'na', 'nahi', 'nahin',
  'haan', 'han', 'ji', 'hai', 'hain', 'hun', 'hoon', 'tha', 'thi', 'thay',
  'raha', 'rahi', 'rahe', 'karna', 'karo', 'kar', 'krna', 'karun', 'karoon',
  'karta', 'karti', 'karte', 'kiya', 'kya', 'kyun', 'kyu', 'kaise', 'kab',
  'kahan', 'kitna', 'kitni', 'kitne', 'kuch', 'zyada', 'ziada', 'bohat',
  'bahut', 'thora', 'thoda', 'chahiye', 'chahye', 'acha', 'acchi', 'achi',
  'theek', 'thik', 'paisa', 'paise', 'rupay', 'rupaye', 'mahina', 'mahine',
  'lekin', 'magar', 'agar', 'matlab', 'samajh', 'samjhao', 'samjha',
  'batao', 'bata', 'madad', 'jaldi', 'hoga', 'hogi', 'hogay', 'honge',
]);

const ENGLISH_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
  'would', 'will', 'shall', 'may', 'might', 'must', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'this', 'that', 'these', 'those', 'what', 'why',
  'how', 'when', 'where', 'who', 'which', 'please', 'thanks', 'thank',
  'hello', 'hi', 'yes', 'no', 'ok', 'okay', 'good', 'bad',
]);

export function containsUrduScript(text: string): boolean {
  return URDU_SCRIPT_RE.test(text);
}

/** Mirrors the backend's `detect_language` heuristic (see that module's
 * docstring for the full rationale) closely enough to avoid a visible
 * flash of the wrong direction/font on the user's own message. */
export function detectMessageLanguage(
  text: string,
  previousLanguage?: MessageLanguage
): MessageLanguage {
  const stripped = text.trim();
  if (!stripped) return previousLanguage ?? 'en';
  if (containsUrduScript(stripped)) return 'ur';

  const words = (stripped.match(WORD_RE) ?? []).map((w) => w.toLowerCase());
  if (words.length === 0) return previousLanguage ?? 'en';

  const romanHits = words.filter((w) => ROMAN_URDU_WORDS.has(w)).length;
  const englishHits = words.filter((w) => ENGLISH_WORDS.has(w)).length;

  if (words.length <= 2) {
    if (romanHits && !englishHits) return 'roman-ur';
    if (englishHits && !romanHits) return 'en';
    if (previousLanguage) return previousLanguage;
    return romanHits ? 'roman-ur' : 'en';
  }

  const ratio = romanHits / words.length;
  if (romanHits > 0 && ratio >= 0.15) return 'roman-ur';
  return 'en';
}

/** Text direction for a detected/known message language. Urdu script is
 * RTL; both English and Roman Urdu are Latin-script and stay LTR. */
export function directionFor(language: MessageLanguage | undefined): 'rtl' | 'ltr' {
  return language === 'ur' ? 'rtl' : 'ltr';
}

/** Tailwind font-family utility class for a detected message language —
 * Urdu script gets the Nastaliq webfont; Latin-script messages (English
 * and Roman Urdu) use the app's normal body font. */
export function fontClassFor(language: MessageLanguage | undefined): string {
  return language === 'ur' ? 'font-urdu' : '';
}
