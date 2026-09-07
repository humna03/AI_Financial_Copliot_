import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, registerUser } from '../../store/slices/authSlice';
import { pushToast } from '../../store/slices/uiSlice';
import { ROUTES } from '../../constants/routes';
import type { Language } from '../../types/auth.types';
import { setLanguage } from '../../store/slices/languageSlice';

export function RegisterPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguageChoice] = useState<Language>('en');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(
      registerUser({ full_name: fullName, email, password, language })
    );
    if (registerUser.fulfilled.match(result)) {
      dispatch(setLanguage(language));
      dispatch(pushToast('success', t('account_created')));
      navigate(ROUTES.financial, { replace: true });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-sans text-xl font-semibold text-ink-900 dark:text-ink-50">
        {t('register_title')}
      </h1>
      <p className="mt-1 text-sm text-ink-400">{t('register_subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label={t('field_full_name')}
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label={t('field_email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t('field_password')}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint={t('password_hint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Select
          label={t('field_language')}
          value={language}
          onChange={(e) => setLanguageChoice(e.target.value as Language)}
        >
          <option value="en">{t('language_english')}</option>
          <option value="ur">{t('language_urdu')}</option>
        </Select>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={status === 'loading'} className="mt-2 w-full">
          {t('action_register')}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-400">
        {t('have_account')}{' '}
        <Link to={ROUTES.login} className="font-medium text-ink-700 dark:text-gold-400">
          {t('action_login')}
        </Link>
      </p>
    </Card>
  );
}
