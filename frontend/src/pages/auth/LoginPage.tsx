import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, loginUser } from '../../store/slices/authSlice';
import { pushToast } from '../../store/slices/uiSlice';
import { ROUTES } from '../../constants/routes';

export function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: Location })?.from?.pathname ?? ROUTES.dashboard;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      dispatch(pushToast('success', t('welcome_back')));
      navigate(from, { replace: true });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-sans text-xl font-semibold text-ink-900 dark:text-ink-50">
        {t('login_title')}
      </h1>
      <p className="mt-1 text-sm text-ink-400">{t('login_subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={status === 'loading'} className="mt-2 w-full">
          {t('action_login')}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-400">
        {t('no_account')}{' '}
        <Link to={ROUTES.register} className="font-medium text-ink-700 dark:text-gold-400">
          {t('action_register')}
        </Link>
      </p>
    </Card>
  );
}
