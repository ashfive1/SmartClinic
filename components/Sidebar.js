"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import "../styles/sidebar.css"
import { useTheme } from "next-themes"

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut, isDoctor } = useAuth()
  const { theme, setTheme } = useTheme()

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      iconClass: "fi fi-rr-home",
      allowedRoles: ["doctor", "nurse", "admin"],
    },
    {
      name: "Patient Records", // Added patient records navigation
      href: "/dashboard/patients",
      iconClass: "fi fi-rr-folders",
      allowedRoles: ["doctor", "nurse", "admin"],
    },
    {
      name: "Patient Intake",
      href: "/dashboard/intake",
      iconClass: "fi fi-rr-file-edit",
      allowedRoles: ["doctor"], // Only doctors can access
    },
    {
      name: "Chatbot",
      href: "/dashboard/chatbot",
      iconClass: "fi fi-rr-comments",
      allowedRoles: ["doctor", "nurse", "admin"],
    },
  ]

  const filteredNavigation = navigationItems.filter((item) => item.allowedRoles.includes(profile?.role))

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile menu toggle */}
      <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation menu">
        ☰
      </button>

      {/* Sidebar */}
      <nav className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Medical Dashboard</h2>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-card">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredNavigation.map((item) => (
                <li key={item.name} className="sidebar-nav-item">
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <button className="nav-btn" aria-label={item.name}>
                      <i className={`nav-icon ${item.iconClass}`} aria-hidden="true" />
                      {item.name}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User info and logout */}
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{profile?.full_name || "User"}</div>
          <div className="sidebar-user-role">{profile?.role}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.75rem" }}>
            <label className="switch" title="Toggle theme">
              <input type="checkbox" checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
              <span className="slider" />
            </label>
            <button className="Btn" onClick={handleSignOut} aria-label="Sign out">
              <span className="sign">
                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M377.9 105.9 512 240 377.9 374.1l-33.8-33.8L412.5 272H192v-32h220.5l-68.4-68.4 33.8-33.7zM352 80v48H96v256h256v48H80c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16h272z"/>
                </svg>
              </span>
              <span className="text">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
