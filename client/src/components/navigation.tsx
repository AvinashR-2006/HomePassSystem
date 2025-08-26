import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-chart-line" },
    { path: "/student-form", label: "Student Apply", icon: "fas fa-user-graduate" },
    { path: "/parent-approval", label: "Parent Portal", icon: "fas fa-user-friends" },
    { path: "/warden-panel", label: "Warden Panel", icon: "fas fa-shield-alt" },
    { path: "/security-scanner", label: "Scanner", icon: "fas fa-qrcode" },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">
                <i className="fas fa-home mr-2"></i>
                Smart Home Pass
              </h1>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === item.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-muted-foreground">
              <i className="fas fa-user-circle mr-2"></i>
              Admin Portal
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
