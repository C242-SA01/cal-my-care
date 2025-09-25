import { Outlet } from "react-router-dom";
import AdminSidebarContent from "@/components/AdminSidebar";
import AdminBottomNavbar from "@/components/AdminBottomNavbar";
import { AdminHeader } from "@/components/AdminHeader";
import { useMobile } from "@/hooks/use-mobile";

const AdminLayout = () => {
  const isMobile = useMobile();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <AdminSidebarContent />
      </div>

      <div className="flex flex-col">
        {/* Header */}
        <AdminHeader isMobile={isMobile} />

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background/40 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navbar for Mobile */}
      {isMobile && <AdminBottomNavbar />}
    </div>
  );
};

export default AdminLayout;
