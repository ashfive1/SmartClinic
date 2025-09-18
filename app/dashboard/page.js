"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase"
import { USE_MOCK_DATA, MockData } from "@/lib/utils"
import "@/styles/dashboard.css"

export default function DashboardPage() {
  const { profile, loading, isDoctor } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayIntakes: 0,
    criticalPatients: 0,
    recentRecords: [],
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!loading && profile) {
      if (USE_MOCK_DATA) {
        const today = new Date().toISOString().split("T")[0]
        const allRecords = MockData.patients.flatMap((p) =>
          (p.patient_records || []).map((r) => ({ ...r, patients: { patient_id: p.patient_id, first_name: p.first_name, last_name: p.last_name } })),
        )
        const todayIntakes = allRecords.filter((r) => r.created_at.startsWith(today)).length
        const criticalPatients = allRecords.filter((r) => ["high", "critical"].includes(r.risk_level)).length
        const recentRecords = allRecords
          .slice()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
        setStats({
          totalPatients: MockData.patients.length,
          todayIntakes,
          criticalPatients,
          recentRecords,
        })
        setIsLoadingStats(false)
      } else {
        fetchDashboardStats()
      }
    }
  }, [loading, profile])

  const fetchDashboardStats = async () => {
    try {
      // Get total patients count
      const { count: totalPatients } = await supabase.from("patients").select("*", { count: "exact", head: true })

      // Get today's intake records
      const today = new Date().toISOString().split("T")[0]
      const { count: todayIntakes } = await supabase
        .from("patient_records")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)

      // Get critical patients count
      const { count: criticalPatients } = await supabase
        .from("patient_records")
        .select("*", { count: "exact", head: true })
        .in("risk_level", ["high", "critical"])

      // Get recent records with patient info
      const { data: recentRecords } = await supabase
        .from("patient_records")
        .select(
          `
          id,
          created_at,
          risk_level,
          chief_complaint,
          patients (
            patient_id,
            first_name,
            last_name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalPatients: totalPatients || 0,
        todayIntakes: todayIntakes || 0,
        criticalPatients: criticalPatients || 0,
        recentRecords: recentRecords || [],
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#d97706"
      case "low":
        return "#059669"
      default:
        return "#6b7280"
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "50vh",
        }}
      >
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {profile?.full_name}</h1>
        <p className="dashboard-subtitle">
          {isDoctor ? "Doctor Dashboard - Full Access" : "Nurse Dashboard - View Only"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{isLoadingStats ? "..." : stats.totalPatients}</div>
          <div className="stat-label">Total Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{isLoadingStats ? "..." : stats.todayIntakes}</div>
          <div className="stat-label">Today's Intakes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--danger-color)" }}>
            {isLoadingStats ? "..." : stats.criticalPatients}
          </div>
          <div className="stat-label">Critical Patients</div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Recent Patient Records</h3>
            <p className="dashboard-card-description">Latest patient intake records</p>
          </div>

          {isLoadingStats ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Loading recent records...</div>
          ) : stats.recentRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              No recent records found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats.recentRecords.map((record) => (
                <a
                  href={`/dashboard/patients?q=${encodeURIComponent(record.patients?.patient_id ?? "")}`}
                  key={record.id}
                  style={{
                    padding: "1rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    borderLeft: `4px solid ${getRiskLevelColor(record.risk_level)}`,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600" }}>
                        {record.patients?.first_name} {record.patients?.last_name}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        ID: {record.patients?.patient_id}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: getRiskLevelColor(record.risk_level),
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    >
                      {record.risk_level}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{record.chief_complaint}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    {new Date(record.created_at).toLocaleDateString()} at{" "}
                    {new Date(record.created_at).toLocaleTimeString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Quick Actions</h3>
            <p className="dashboard-card-description">Common tasks and shortcuts</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {isDoctor && (
              <a
                href="/dashboard/intake"
                style={{
                  display: "block",
                  padding: "1rem",
                  backgroundColor: "var(--primary-color)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "var(--radius)",
                  textAlign: "center",
                  fontWeight: "500",
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "var(--primary-hover)")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "var(--primary-color)")}
              >
                📝 New Patient Intake
              </a>
            )}

            <a
              href="/dashboard/chatbot"
              style={{
                display: "block",
                padding: "1rem",
                backgroundColor: "var(--secondary-color)",
                color: "white",
                textDecoration: "none",
                borderRadius: "var(--radius)",
                textAlign: "center",
                fontWeight: "500",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#475569")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "var(--secondary-color)")}
            >
              🤖 AI Assistant
            </a>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: "500", marginBottom: "0.5rem" }}>Your Role</div>
              <div
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: isDoctor ? "var(--success-color)" : "var(--primary-color)",
                  color: "white",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  textTransform: "capitalize",
                }}
              >
                {profile?.role}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                {isDoctor ? "Full system access" : "Read-only access"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
