import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, BarChart2, Settings } from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx';
import { useData } from './contexts/DataContext.jsx';
import Header from './components/Layout/Header.jsx';
import AuthOverlay from './components/Auth/AuthOverlay.jsx';
import SheetSetup from './components/Setup/SheetSetup.jsx';
import WorkoutPage from './pages/WorkoutPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  const { status: authStatus } = useAuth();
  const { sheetId } = useData();
  const location = useLocation();

  const isAuthenticated = authStatus === 'authenticated';
  const needsSheetSetup = isAuthenticated && !sheetId;

  return (
    <div className="app">
      <Header />

      <Routes>
        <Route path="/"         element={<WorkoutPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*"         element={<WorkoutPage />} />
      </Routes>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Dumbbell size={20} />
          Workout
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <BarChart2 size={20} />
          Progress
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      {/* Auth overlay — shown when not signed in */}
      {!isAuthenticated && <AuthOverlay />}

      {/* Sheet setup — shown when authenticated but no sheet configured */}
      {needsSheetSetup && <SheetSetup />}
    </div>
  );
}
