import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Loading';
import { CopilotMessageContent } from '../components/copilot/CopilotMessageContent';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { askCopilot } from '../api/copilot.api';
import type { ChatMessage, ConversationTurn } from '../types/copilot.types';
import { ApiError } from '../types/api.types';
import { classNames } from '../utils/helpers';
import { detectMessageLanguage, directionFor, fontClassFor, type MessageLanguage } from '../utils/messageLanguage';

const SUGGESTED_PROMPTS = ['prompt_improve', 'prompt_reduce', 'prompt_save', 'prompt_goals'] as const;

/** Builds the {role, content} history the backend expects from the chat
 * so far, dropping error bubbles (they were never sent to the AI and
 * carry no real conversational content) and capping length client-side
 * too (the API layer also caps, this just avoids building a huge array on
 * very long-running conversations). */
function toHistory(messages: ChatMessage[]): ConversationTurn[] {
  return messages
    .filter((m) => !m.isError)
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function CopilotPage() {
  const { financialUserId } = useAuth();
  const { t, lang } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const lastKnownLanguage = (): MessageLanguage | undefined => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isError && messages[i].language) return messages[i].language;
    }
    return undefined;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!financialUserId || !trimmed || sending) return;

    const history = toHistory(messages);
    const optimisticLanguage = detectMessageLanguage(trimmed, lastKnownLanguage());
    const userMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: trimmed, language: optimisticLanguage },
    ]);
    setQuestion('');
    setSending(true);

    try {
      const res = await askCopilot(financialUserId, trimmed, history);
      setMessages((prev) =>
        prev
          .map((m) => (m.id === userMsgId ? { ...m, language: res.language } : m))
          .concat({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.answer,
            language: res.language,
          })
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('copilot_unavailable');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          isError: true,
          // No AI-detected language for a client-side error message —
          // fall back to the app's current interface language so the
          // error itself still reads and aligns correctly.
          language: lang === 'ur' ? 'ur' : 'en',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(question);
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <PageHeader
        title={t('copilot_title')}
        subtitle={t('copilot_subtitle')}
      />

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="max-w-xs text-sm text-ink-400">{t('copilot_empty')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(t(p))}
                    className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-500 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    {t(p)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const dir = directionFor(m.language);
            const fontClass = fontClassFor(m.language);
            return (
              <div
                key={m.id}
                className={classNames('flex animate-fade-in-up', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  dir={dir}
                  lang={m.language === 'ur' ? 'ur' : 'en'}
                  className={classNames(
                    'max-w-[80%] min-w-0 overflow-hidden rounded-2xl px-4 py-2.5 text-sm [overflow-wrap:anywhere]',
                    fontClass,
                    m.role === 'user'
                      ? 'bg-[var(--primary)] text-white dark:text-ink-950'
                      : m.isError
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                        : 'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
                  )}
                >
                  <CopilotMessageContent text={m.content} />
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex animate-fade-in justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-ink-100 px-4 py-2.5 text-sm text-ink-400 dark:bg-ink-800">
                <Spinner className="h-4 w-4" /> {t('copilot_thinking')}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-ink-800"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('copilot_placeholder')}
            dir="auto"
            className="min-w-0 flex-1 rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm leading-relaxed focus:border-ink-500 focus:outline-none focus:ring-1 focus:ring-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
          />
          <Button type="submit" disabled={!question.trim()} loading={sending} aria-label={t('action_ask')}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
