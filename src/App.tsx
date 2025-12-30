import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProfessorWalletPage } from './pages/ProfessorWallet';
import { MyWalletPage } from './pages/MyWalletPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SettingsPage } from './pages/SettingsPage';
import { PortfolioProvider } from './context/PortfolioContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <PortfolioProvider>
      <SettingsProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/professor" element={<ProfessorWalletPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/kraken" element={<AnalysisPage />} />
              <Route path="/wallet" element={<MyWalletPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </SettingsProvider>
    </PortfolioProvider>
  );
}

export default App

