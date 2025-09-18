"use client"

import { useAuth } from "@/hooks/useAuth"
import IntakeForm from "@/components/IntakeForm"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function IntakePage() {
  const { profile, loading, isDoctor } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isDoctor) {
      // Redirect non-doctors away from this page
      router.push("/dashboard")
    }
  }, [loading, isDoctor, router])

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

  if (!isDoctor) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem",
        }}
      >
        <h2 style={{ color: "var(--danger-color)", marginBottom: "1rem" }}>Access Denied</h2>
        <p style={{ color: "var(--text-secondary)" }}>Only doctors can access the patient intake system.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Patient Intake</h1>
        <p className="dashboard-subtitle">Add new patient intake data and vital signs</p>
      </div>

      <IntakeForm />
    </div>
  )
}
