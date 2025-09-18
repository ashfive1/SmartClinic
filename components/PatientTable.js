"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { USE_MOCK_DATA, MockData, downloadBlobAsFile, generateCsvFromObjects } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

const PatientTable = () => {
  const { profile } = useAuth()
  const supabase = USE_MOCK_DATA ? null : createClient()
  const isAdmin = profile?.role === "admin"
  const [editPatientId, setEditPatientId] = useState(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' })

  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedPatients, setSelectedPatients] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(10)

  useEffect(() => {
    fetchPatients()
  }, [sortField, sortDirection])

  // Read optional query param to auto-filter list
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const q = params.get("q")
      if (q) setSearchTerm(q)
    }
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      let rows = []
      if (USE_MOCK_DATA) {
        rows = MockData.patients.slice().sort((a, b) => {
          const av = a[sortField]
          const bv = b[sortField]
          const cmp = ("" + av).localeCompare("" + bv)
          return sortDirection === "asc" ? cmp : -cmp
        })
      } else {
        const { data, error } = await supabase
          .from("patients")
          .select(`
            id, patient_id, first_name, last_name, gender, phone, email, date_of_birth, created_at,
            patient_ratings (rating, summary, created_at),
            patient_records (
              id, created_at, risk_level, chief_complaint, systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_saturation
            )
          `)
          .order(sortField, { ascending: sortDirection === "asc" })
        if (error) throw error
        rows = data
      }

      // Helper: get latest rating and summary
      function getLatestRating(ratings) {
        if (!ratings || ratings.length === 0) return { rating: "-", summary: "-" }
        const sorted = ratings.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        return { rating: sorted[0].rating, summary: sorted[0].summary }
      }

      // Placeholder: model-based rating generation (to be replaced with real model call)
      function generateRatingFromData(patient) {
        // Example: if any record is critical, return red; if high, orange; else green
        if (patient.patient_records?.some(r => r.risk_level === "critical")) return "red"
        if (patient.patient_records?.some(r => r.risk_level === "high")) return "orange"
        return "green"
      }

      const processedPatients = rows.map((patient) => {
        const latestRecord = patient.patient_records?.[0]
        const { rating, summary } = getLatestRating(patient.patient_ratings)
        // If no rating, generate one (simulate model)
        const displayRating = rating === "-" ? generateRatingFromData(patient) : rating
        return {
          ...patient,
          name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          latestRecord,
          recordsCount: patient.patient_records?.length || 0,
          displayRating,
          summary: summary === "-" ? (latestRecord?.chief_complaint || "-") : summary,
        }
      })

      setPatients(processedPatients)
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSelectPatient = (patientId) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId) ? prev.filter((id) => id !== patientId) : [...prev, patientId],
    )
  }

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([])
    } else {
      setSelectedPatients(filteredPatients.map((p) => p.id))
    }
  }

  const handleExportSelected = async (format = "json") => {
    if (selectedPatients.length === 0) {
      alert("Please select patients to export")
      return
    }

    try {
      if (USE_MOCK_DATA) {
        const selected = patients.filter((p) => selectedPatients.includes(p.id))
        let blob
        if (format === "csv") {
          const flat = selected.map((p) => ({
            id: p.id,
            patient_id: p.patient_id,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            phone: p.phone,
            created_at: p.created_at,
            latest_risk: p.latestRecord?.risk_level || "",
          }))
          const csv = generateCsvFromObjects(flat)
          blob = new Blob([csv], { type: "text/csv" })
        } else {
          blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" })
        }
        downloadBlobAsFile(blob, `patients_export_${new Date().toISOString().split("T")[0]}.${format}`)
      } else {
        const response = await fetch("/api/patients/bulk-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientIds: selectedPatients, format }),
        })
        if (!response.ok) throw new Error("Export failed")
        const blob = await response.blob()
        downloadBlobAsFile(blob, `patients_export_${new Date().toISOString().split("T")[0]}.${format}`)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export patient records")
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const query = (searchTerm || "").toLowerCase()
    const pid = ((patient.patient_id ?? patient.id) || "").toLowerCase()
    const first = (patient.first_name || "").toLowerCase()
    const last = (patient.last_name || "").toLowerCase()
    const email = (patient.email || "").toLowerCase()
    return (
      pid.includes(query) ||
      first.includes(query) ||
      last.includes(query) ||
      email.includes(query)
    )
  })

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
        }}
      >
        <div>Loading patients...</div>
      </div>
    )
  }

  const handleEditClick = (patient) => {
    setEditPatientId(patient.id)
    setEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      phone: patient.phone || '',
    })
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleEditSave = async (patient) => {
    if (USE_MOCK_DATA) {
      // Update local mock data (not persistent)
      setPatients((prev) => prev.map((p) => p.id === patient.id ? { ...p, ...editForm, name: `${editForm.first_name} ${editForm.last_name}` } : p))
      setEditPatientId(null)
      return
    }
    const { error } = await supabase
      .from('patients')
      .update({ first_name: editForm.first_name, last_name: editForm.last_name, phone: editForm.phone })
      .eq('id', patient.id)
    if (!error) {
      setPatients((prev) => prev.map((p) => p.id === patient.id ? { ...p, ...editForm, name: `${editForm.first_name} ${editForm.last_name}` } : p))
      setEditPatientId(null)
    } else {
      alert('Failed to update patient')
    }
  }

  return (
    <div>
      {/* Search and Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <input
            type="text"
            placeholder="Search patients by ID, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ margin: 0 }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleExportSelected("json")}
            className="btn-primary"
            disabled={selectedPatients.length === 0}
            style={{
              opacity: selectedPatients.length === 0 ? 0.5 : 1,
              cursor: selectedPatients.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Export JSON ({selectedPatients.length})
          </button>
          <button
            onClick={() => handleExportSelected("csv")}
            className="btn-secondary"
            disabled={selectedPatients.length === 0}
            style={{
              opacity: selectedPatients.length === 0 ? 0.5 : 1,
              cursor: selectedPatients.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Export CSV ({selectedPatients.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "var(--background)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                <input
                  type="checkbox"
                  checked={currentPatients.length > 0 && currentPatients.every((p) => selectedPatients.includes(p.id))}
                  onChange={handleSelectAll}
                  style={{ margin: 0 }}
                />
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Patient ID</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Gender</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Phone</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>DOB</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Summary</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {currentPatients.map((patient) => (
              <tr
                key={patient.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: selectedPatients.includes(patient.id) ? "var(--surface)" : "transparent",
                }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(patient.id)}
                    onChange={() => handleSelectPatient(patient.id)}
                    style={{ margin: 0 }}
                  />
                </td>
                <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                  {patient.patient_id || "-"}
                </td>
                <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                  {editPatientId === patient.id ? (
                    <>
                      <input
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleEditChange}
                        style={{ width: 80, marginRight: 4 }}
                      />
                      <input
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleEditChange}
                        style={{ width: 80 }}
                      />
                    </>
                  ) : (
                    patient.name
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>{patient.gender || "-"}</td>
                <td style={{ padding: "0.75rem" }}>
                  {editPatientId === patient.id ? (
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      style={{ width: 110 }}
                    />
                  ) : (
                    patient.phone || "-"
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>{patient.email || "-"}</td>
                <td style={{ padding: "0.75rem" }}>{patient.date_of_birth ? formatDate(patient.date_of_birth) : "-"}</td>
                <td style={{ padding: "0.75rem", fontSize: "0.95em" }}>{patient.summary || "-"}</td>
                <td style={{ padding: "0.75rem", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      backgroundColor:
                        patient.displayRating === "red"
                          ? "#dc2626"
                          : patient.displayRating === "orange"
                          ? "#ea580c"
                          : patient.displayRating === "green"
                          ? "#059669"
                          : "#6b7280",
                      color: "white",
                      textTransform: "capitalize",
                    }}
                  >
                    {patient.displayRating}
                  </span>
                  {isAdmin && (
                    editPatientId === patient.id ? (
                      <>
                        <button className="btn-primary" style={{ marginLeft: 4 }} onClick={() => handleEditSave(patient)}>Save</button>
                        <button className="btn-secondary" style={{ marginLeft: 4 }} onClick={() => setEditPatientId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-secondary" style={{ marginLeft: 4 }} onClick={() => handleEditClick(patient)}>Edit</button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Showing {indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, filteredPatients.length)} of{" "}
            {filteredPatients.length} patients
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={pageNum === currentPage ? "btn-primary" : "btn-secondary"}
                  style={{ minWidth: "40px" }}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientTable
