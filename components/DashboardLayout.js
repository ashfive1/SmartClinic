"use client"

import { AuthProvider } from "@/hooks/useAuth"
import Sidebar from "./Sidebar"
import "../styles/dashboard.css"

const DashboardLayout = ({ children }) => {
  return (
    <AuthProvider>
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">{children}</main>
      </div>
    </AuthProvider>
  )
}

export default DashboardLayout
