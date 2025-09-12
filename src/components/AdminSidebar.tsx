import { NavLink, useNavigate } from "react-router-dom";
import { Home, LineChart, LogOut, Package2, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span>CalMyCare</span>
          </NavLink>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/dashboard" end>
              {({ isActive }) => (
                <SidebarMenuButton isActive={isActive}>
                  <Home className="h-4 w-4" />
                  Dashboard
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NavLink to="/dashboard/patients">
              {({ isActive }) => (
                <SidebarMenuButton isActive={isActive}>
                  <Users className="h-4 w-4" />
                  Pasien
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NavLink to="/dashboard/results">
              {({ isActive }) => (
                <SidebarMenuButton isActive={isActive}>
                  <LineChart className="h-4 w-4" />
                  Hasil Skrining
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
