import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useGetIdentity, useLogout, useRefineOptions } from "@refinedev/core";
import { LogOutIcon, User, Settings, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "px-4",
        "justify-end",
        "z-40",
      )}
    >
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="h-8 w-[1px] bg-border mx-2" /> {/* Ngăn cách nhẹ */}
        <UserDropdown />
      </div>
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();
  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40",
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
        })}
      />

      <div className="flex items-center gap-2 overflow-hidden">
        <div>{title?.icon}</div>
        <h2
          className={cn("text-sm font-bold truncate", {
            "opacity-0": !open && !isMobile,
          })}
        >
          {title?.text}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle className="h-8 w-8" />
        <UserDropdown />
      </div>
    </header>
  );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const navigate = useNavigate();

  // Lấy dữ liệu user từ authProvider
  const { data: user } = useGetIdentity<{ name: string; avatar: string }>();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-3 hover:bg-accent/50 p-1.5 rounded-lg transition-colors cursor-pointer">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user?.name || "Lục Viễn Phong"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </p>
          </div>
          <UserAvatar />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 mt-2 shadow-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || "Lục Viễn Phong"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              Quản trị viên hệ thống Healix
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Hồ sơ cá nhân</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Cài đặt hệ thống</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Header.displayName = "Header";
