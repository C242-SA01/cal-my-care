import { Outlet } from 'react-router-dom';
import PatientSidebarContent from '@/components/PatientSidebar';
import BottomNavbar from '@/components/BottomNavbar';
import { PatientHeader } from '@/components/PatientHeader';
import { useMobile } from '@/hooks/use-mobile';
import { useFirstTimeGate } from '@/hooks/useFirstTimeGate';
import ChatBubble from '@/components/ChatBubble';

const PatientLayout = () => {
  useFirstTimeGate(); // Enforce first-time screening
  const isMobile = useMobile();

  return (
    <div className="min-h-screen w-full bg-background/40">
      {/* Sidebar for Desktop - Fixed Position */}
      <aside className="hidden md:flex h-screen w-[220px] lg:w-[280px] flex-col fixed inset-y-0 left-0 z-10 border-r bg-white">
        <PatientSidebarContent />
      </aside>

      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
        <PatientHeader isMobile={isMobile} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile-only and floating elements */}
      {isMobile && <BottomNavbar />}
      <div className="fixed bottom-28 right-4 md:bottom-12 md:right-8 z-[999]">
        <ChatBubble />
      </div>
    </div>
  );
};

export default PatientLayout;
