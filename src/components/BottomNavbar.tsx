import { Home, ClipboardList, BookOpen, LayoutDashboard, Heart } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/quiz', icon: ClipboardList, label: 'Quiz' },
  { to: '/calmy', icon: Heart, label: 'Calmy' },
  { to: '/education', icon: BookOpen, label: 'Edukasi' },
  // { to: '/history', icon: LayoutDashboard, label: 'Riwayat' },
  { to: '/history', icon: LayoutDashboard, label: 'Care' },
];

const BottomNavbar = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 rounded-t-lg py-2 text-xs sm:text-sm transition-colors ${isActive ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background/80 backdrop-blur-sm md:hidden">
      {menuItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={navLinkClasses}>
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;
