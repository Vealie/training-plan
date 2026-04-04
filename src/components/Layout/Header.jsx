import { Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import SyncIndicator from './SyncIndicator.jsx';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <Dumbbell size={22} className="logo-icon" />
        Workout Tracker
      </Link>
      <div className="header-right">
        <SyncIndicator />
      </div>
    </header>
  );
}
