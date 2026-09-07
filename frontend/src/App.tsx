import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute, GuestOnlyRoute } from './components/common/ProtectedRoute';
import { ROUTES } from './constants/routes';
import { useSessionRestore } from './hooks/useSessionRestore';
import { useSystemThemeListener } from './hooks/useSystemThemeListener';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancialProfilePage } from './pages/FinancialProfilePage';
import { GoalsPage } from './pages/GoalsPage';
import { FinancialScorePage } from './pages/FinancialScorePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { CopilotPage } from './pages/CopilotPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  useSessionRestore();
  useSystemThemeListener();

  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />

      <Route
        element={
          <GuestOnlyRoute>
            <AuthLayout />
          </GuestOnlyRoute>
        }
      >
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.financial} element={<FinancialProfilePage />} />
        <Route path={ROUTES.goals} element={<GoalsPage />} />
        <Route path={ROUTES.score} element={<FinancialScorePage />} />
        <Route path={ROUTES.simulator} element={<SimulatorPage />} />
        <Route path={ROUTES.copilot} element={<CopilotPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
