"use client"

import PatientTable from "@/components/PatientTable"

export default function PatientsPage() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Patient Records</h1>
        <p className="dashboard-subtitle">View and manage all patient records with export capabilities</p>
      </div>

      <PatientTable />
    </div>
  )
}
