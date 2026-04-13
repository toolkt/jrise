"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FileText, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Statements", href: "/portal/statements", icon: FileText },
  { label: "Account", href: "/portal/account", icon: User },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

interface PortalNavProps {
  clientName: string;
}

export function PortalNav({ clientName }: PortalNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/portal/dashboard"
          className="mr-4 flex-shrink-0 text-sm font-bold tracking-widest uppercase"
        >
          JRISE Smart Trading
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          <NavLinks />
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Avatar size="sm">
            <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-muted-foreground md:inline-flex"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
