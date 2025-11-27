import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LineChart, LogOut, Package2, Users, BookOpen, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SidebarContentProps {
  onLinkClick?: () => void;
}

const SidebarContent = ({ onLinkClick }: SidebarContentProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
    if (onLinkClick) onLinkClick();
  };

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/admin" className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
          <Package2 className="h-6 w-6" />
          <span className="">CalMyCare</span>
        </NavLink>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <NavLink to="/admin" end onClick={handleLinkClick} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}>
            <Home className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/patients"
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            <Users className="h-4 w-4" />
            Pasien
          </NavLink>
          <NavLink
            to="/admin/education"
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            <BookOpen className="h-4 w-4" />
            Edukasi
          </NavLink>
          <NavLink
            to="/admin/emodules"
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            <Package2 className="h-4 w-4" />
            E-Module
          </NavLink>
          <NavLink
            to="/admin/results"
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            <LineChart className="h-4 w-4" />
            Hasil Skrining
          </NavLink>
          <NavLink to="/admin/users" onClick={handleLinkClick} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}>
            <Users className="h-4 w-4" />
            Manajemen Pengguna
          </NavLink>
          <NavLink
            to="/admin/profile"
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            <UserIcon className="h-4 w-4" />
            Profil
          </NavLink>
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;
