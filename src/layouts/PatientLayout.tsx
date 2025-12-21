import { Outlet } from "react-router-dom";
import PatientSidebarContent from "@/components/PatientSidebar";
import BottomNavbar from "@/components/BottomNavbar";
import { PatientHeader } from "@/components/PatientHeader";
import { useMobile } from "@/hooks/use-mobile";
import { useFirstTimeGate } from "@/hooks/useFirstTimeGate";
import ChatBubble from "@/components/ChatBubble"; // Import ChatBubble

const PatientLayout = () => {
  useFirstTimeGate(); // Enforce first-time screening
  const isMobile = useMobile();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <PatientSidebarContent />
      </div>

      <div className="flex flex-col">
        {/* Header */}
        <PatientHeader isMobile={isMobile} />

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background/40 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navbar for Mobile */}
      {isMobile && <BottomNavbar />}
      <ChatBubble /> {/* ChatBubble component */}
    </div>
  );
};

export default PatientLayout;
