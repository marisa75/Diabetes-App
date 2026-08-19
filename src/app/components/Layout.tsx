import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import { Home, MessageCircle, UtensilsCrossed, Calendar, ScanBarcode } from "lucide-react";
import { getProfileAvatar } from "../lib/profileAvatar";

export function Layout() {
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/forum", label: "Forum", icon: MessageCircle },
    { path: "/rezepte", label: "Rezepte", icon: UtensilsCrossed },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/naehrwert-scan", label: "Nährwert", icon: ScanBarcode },
  ];

  // Avatar für den Profil-Button. Bei jedem Routenwechsel neu einlesen, damit
  // Änderungen am Profil (Bild/Name) in der Fußleiste sichtbar werden.
  const location = useLocation();
  const [avatar, setAvatar] = useState(getProfileAvatar);
  useEffect(() => {
    setAvatar(getProfileAvatar());
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="flex flex-col h-screen w-full max-w-md bg-white shadow-xl">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
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
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}

          {/* Profil – Avatar als Button */}
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-[#6495ED]" : "text-gray-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-7 h-7 mb-1 rounded-full overflow-hidden flex items-center justify-center ${
                    isActive ? "ring-2 ring-[#6495ED]" : ""
                  }`}
                >
                  {avatar.avatar ? (
                    <img
                      src={avatar.avatar}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex items-center justify-center w-full h-full text-xs font-semibold text-white select-none"
                      style={{ backgroundColor: avatar.color }}
                    >
                      {avatar.initial}
                    </span>
                  )}
                </span>
                <span className="text-[10px]">Profil</span>
              </>
            )}
          </NavLink>
        </div>
        </nav>
      </div>
    </div>
  );
}
