import { Home, Users, BookOpen, LineChart, icons, Notebook, NotebookPen } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { to: '/admin', icon: Home, label: 'Dashboard' },
  { to: '/admin/patients', icon: Users, label: 'Pasien' },
  { to: '/admin/education', icon: BookOpen, label: 'Edukasi' },
  { to: '/admin/results', icon: LineChart, label: 'Hasil' },
  { to: '/admin/emodules', icon: NotebookPen, label: 'E-Modul' },
];

const AdminBottomNavbar = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) => `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background md:hidden">
      {menuItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={navLinkClasses}>
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminBottomNavbar;
