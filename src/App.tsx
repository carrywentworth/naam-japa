import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import Splash from './pages/Splash';
import Home from './pages/Home';
import CountSelection from './pages/CountSelection';
import Player from './pages/Player';
import Completion from './pages/Completion';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ChantList from './admin/ChantList';
import ChantEdit from './admin/ChantEdit';
import AnalyticsView from './admin/AnalyticsView';
import ConfigPage from './admin/ConfigPage';

function App() {
  return (
    <ThemeProvider>
      <AppConfigProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/home" element={<Home />} />
            <Route path="/count" element={<CountSelection />} />
            <Route path="/player" element={<Player />} />
            <Route path="/complete" element={<Completion />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="chants" element={<ChantList />} />
              <Route path="chants/:id" element={<ChantEdit />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="config" element={<ConfigPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppConfigProvider>
    </ThemeProvider>
  );
}

export default App;
