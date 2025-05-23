import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { LayoutDashboardIcon, Settings, User, Vote, X } from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboardIcon, href: "/admin_dashboard" },
  { name: "Elections", icon: Vote, href: "/admin_dashboard/elections" },
  { name: "Voters", icon: User, href: "/admin_dashboard/voters" },

  {
    name: "System Settings",
    icon: Settings,
    href: "/admin_dashboard/settings",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
interface HeaderProps {
  onSidebarToggle: () => void;
}
export function Header({ onSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Use callbackUrl to ensure redirect happens after server-side session is destroyed
      await signOut({
        redirect: true,
        callbackUrl: "/auth/login?loggedOut=true", // Add a flag to indicate successful logout
      });
      // We don't need router.push here as the redirect is handled by signOut
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };
}
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={`${
        isOpen ? "block" : "hidden"
      } lg:block fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:relative`}
    >
      <div className="flex items-center justify-between p-4">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/wup-logo.png" className="h-14 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            WUP EVS
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
