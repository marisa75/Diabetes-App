import React from "react";
import { Outlet, NavLink } from "react-router";
import { Home, MessageCircle, UtensilsCrossed, Calendar, ScanBarcode } from "lucide-react";

export function Layout() {
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/forum", label: "Forum", icon: MessageCircle },
    { path: "/rezepte", label: "Rezepte", icon: UtensilsCrossed },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/naehrwert-scan", label: "Nährwert-Scan", icon: ScanBarcode },
  ];

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? "text-[#6495ED]" : "text-gray-500"
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
