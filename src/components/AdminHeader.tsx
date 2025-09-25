import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebarContent from "@/components/AdminSidebar";
import { UserMenu } from "@/components/UserMenu";

interface AdminHeaderProps {
  isMobile: boolean;
}

export const AdminHeader = ({ isMobile }: AdminHeaderProps) => {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
            <AdminSidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        // On desktop, the UserMenu will be on the right, so we need a placeholder to balance the flex layout
        <div />
      )}

      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};
