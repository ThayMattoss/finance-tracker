import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProfessorWalletPage } from './pages/ProfessorWallet';
import { MyWalletPage } from './pages/MyWalletPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SettingsPage } from './pages/SettingsPage';
import { PortfolioProvider } from './context/PortfolioContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <PortfolioProvider>
      <SettingsProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/professor" element={<ProfessorWalletPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/kraken" element={<AnalysisPage />} />
                <Route path="/wallet" element={<MyWalletPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </SettingsProvider>
    </PortfolioProvider>
  );
}

export default App

