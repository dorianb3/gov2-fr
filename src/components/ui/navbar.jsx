// src/components/ui/navbar.jsx
import { Link, NavLink } from "react-router-dom"
import UserMenu from "./user-menu"

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { Menu } from "lucide-react"
import ThemeToggle from "../ThemeToggle"

export default function Navbar() {
  const navItems = [
    { label: "Agora", to: "/agora" },
    { label: "Activités", to: "/activity" },
    { label: "Infos", to: "/news" },
    { label: "Données", to: "/data" },
    { label: "A propos", to: "/about" },
  ]

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/50 backdrop-blur supports-[backdrop-filter]:bg-slate-950/30">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* LEFT - LOGO */}
        <Link to="/" className="font-semibold text-lg tracking-tight">
          Gov2.0
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-6 items-center">
          
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition hover:opacity-80 ${
                  isActive ? "text-primary font-medium" : "opacity-70"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>

        {/* RIGHT - USER MENU */}
        <div className="hidden md:block">
          <UserMenu />
        </div>

        {/* MOBILE MENU BUTTON */}
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Menu className="w-6 h-6" />
          </SheetTrigger>

          <SheetContent side="right" className="w-64">
            <SheetTitle>CivicHub</SheetTitle>
            <SheetDescription className="mt-4 space-y-4">

              {/* Mobile menu links */}
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `text-sm ${
                        isActive ? "text-primary font-medium" : "opacity-70"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4">
                <UserMenu />
              </div>

            </SheetDescription>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
