import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, History, LogOut, Package2, User as UserIcon, ClipboardList, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PatientSidebarContentProps {
  onLinkClick?: () => void;
}

const PatientSidebarContent = ({ onLinkClick }: PatientSidebarContentProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
    if (onLinkClick) onLinkClick();
  };

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const menuItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/quiz', icon: ClipboardList, label: 'Quiz' },
    // { to: '/history', icon: History, label: 'Riwayat Hasil' },
    { to: '/history', icon: History, label: 'Care' },
    { to: '/education', icon: BookOpen, label: 'Edukasi' },
    { to: '/emodules', icon: Package2, label: 'E-Modul' },
    { to: '/calmy', icon: Heart, label: 'Calmy' },
    { to: '/profile', icon: UserIcon, label: 'Profil' },
  ];

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/dashboard" className="flex items-center gap-3 font-semibold" onClick={handleLinkClick}>
          <img src="/assets/logo-CalMyCare.png" alt="CalmyCare Logo" className="h-8 w-8" />
          <span className="">CalMyCare</span>
        </NavLink>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={handleLinkClick}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'font-medium'}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
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

export default PatientSidebarContent;
