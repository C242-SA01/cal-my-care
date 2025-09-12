import { Home, LogOut, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const BottomNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 px-4 py-2 text-sm ${
      isActive ? "text-primary" : "text-gray-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background shadow-t-md">
      <NavLink to="/screening" className={navLinkClasses}>
        <Home className="h-5 w-5" />
        <span>Skrining</span>
      </NavLink>
      <NavLink to="/results" className={navLinkClasses}>
        <FileText className="h-5 w-5" />
        <span>Hasil</span>
      </NavLink>
      <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-sm text-gray-500">
        <LogOut className="h-5 w-5" />
        <span>Keluar</span>
      </button>
    </nav>
  );
};

export default BottomNavbar;
