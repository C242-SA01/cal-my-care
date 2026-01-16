import { Outlet } from "react-router-dom";
import AdminSidebarContent from "@/components/AdminSidebar";
import AdminBottomNavbar from "@/components/AdminBottomNavbar";
import { AdminHeader } from "@/components/AdminHeader";
import { useMobile } from "@/hooks/use-mobile";
import ChatBubble from '@/components/ChatBubble';

const AdminLayout = () => {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen w-full bg-background/40">
      {/* Sidebar for Desktop - Fixed Position */}
      <aside className="hidden md:flex h-screen w-[220px] lg:w-[280px] flex-col fixed inset-y-0 left-0 z-10 border-r bg-muted/40">
        <AdminSidebarContent />
      </aside>

      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
        <AdminHeader isMobile={isMobile} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile-only and floating elements */}
      {isMobile && <AdminBottomNavbar />}
      <div className="fixed bottom-28 right-4 md:bottom-12 md:right-8 z-[999]">
        <ChatBubble />
      </div>
    </div>
  );
};

export default AdminLayout;
