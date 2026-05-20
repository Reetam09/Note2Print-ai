import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  FileEdit, 
  Mic, 
  Image as ImageIcon, 
  Save, 
  Settings as SettingsIcon,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exam-generator", label: "Create Exam", icon: FileEdit },
  { href: "/assignment-builder", label: "Create Assignment", icon: FileText },
  { href: "/saved", label: "Saved Papers", icon: Save },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <Link href="/" className="font-bold text-xl text-primary tracking-tight">Note2Print</Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:shrink-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <Link href="/" className="font-bold text-2xl text-primary tracking-tight block cursor-pointer">Note2Print</Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group cursor-pointer",
                  active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted"
                )}>
                  <Icon className={cn("h-4 w-4", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-primary mb-1">Need help?</h4>
            <p className="text-xs text-muted-foreground mb-3">Check out our guide for teachers.</p>
            <Button variant="outline" className="w-full text-xs" size="sm">View Guide</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
