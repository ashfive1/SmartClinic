"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { USE_MOCK_DATA, MockData, downloadBlobAsFile } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import "../styles/chatbot.css"

const ChatUI = () => {
  const { profile } = useAuth()
  const supabase = USE_MOCK_DATA ? null : createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [expandedEvidence, setExpandedEvidence] = useState({})
  const [error, setError] = useState("")
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError("")
    setPatientData(null)
    setRecommendations([])

    try {
      let patient
      if (USE_MOCK_DATA) {
        const q = searchQuery.trim().toLowerCase()
        const matches = MockData.patients.filter((p) => {
          const idMatch = p.patient_id.toLowerCase() === q
          const nameMatch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
          return idMatch || nameMatch
        })
        if (matches.length === 0) {
          setError("No patient found matching your search criteria")
          return
        }
        patient = matches[0]
      } else {
        // Search for patient by ID or name
        let query = supabase.from("patients").select(`
          id,
          patient_id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email,
          medical_record_number,
          patient_records (
            id,
            created_at,
            systolic_bp,
            diastolic_bp,
            heart_rate,
            temperature,
            respiratory_rate,
            oxygen_saturation,
            consciousness_level,
            pain_scale,
            chief_complaint,
            symptoms,
            allergies,
            current_medications,
            medical_history,
            risk_level,
            notes
          )
        `)
        if (searchQuery.match(/^P\d+$/i)) {
          query = query.eq("patient_id", searchQuery.toUpperCase())
        } else {
          const nameParts = searchQuery.trim().split(" ")
          if (nameParts.length === 1) {
            query = query.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`)
          } else {
            query = query
              .ilike("first_name", `%${nameParts[0]}%`)
              .ilike("last_name", `%${nameParts[nameParts.length - 1]}%`)
          }
        }
        const { data, error: searchError } = await query
        if (searchError) throw searchError
        if (!data || data.length === 0) {
          setError("No patient found matching your search criteria")
          return
        }
        patient = data[0]
      }

      // Fetch latest rating/review for better LLM context
      if (!USE_MOCK_DATA) {
        const { data: ratingsData } = await supabase
          .from("patient_ratings")
          .select("rating, summary, created_at")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(1)
        if (ratingsData && ratingsData.length > 0) {
          patient = { ...patient, patient_ratings: ratingsData }
        }
      }

      setPatientData(patient)

      // Generate AI recommendations
      await generateRecommendations(patient)

      if (!USE_MOCK_DATA) {
        await supabase.from("chat_sessions").insert({
          user_id: profile.id,
          patient_id: patient.id,
          query: searchQuery,
          response: {
            patient_found: true,
            records_count: patient.patient_records?.length || 0,
          },
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      setError(error.message || "An error occurred while searching")
    } finally {
      setIsSearching(false)
    }
  }

  const generateRecommendations = async (patient) => {
    if (USE_MOCK_DATA) {
      setRecommendations(generateFallbackRecommendations(patient))
      return
    }
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient }),
      })
      if (!response.ok) throw new Error("Failed to generate recommendations")
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error("Error generating recommendations:", error)
      setRecommendations(generateFallbackRecommendations(patient))
    }
  }

  const generateFallbackRecommendations = (patient) => {
    const latestRecord = patient.patient_records?.[0]
    if (!latestRecord) return []

    const recommendations = []

    // Risk-based recommendations
    if (latestRecord.risk_level === "critical" || latestRecord.risk_level === "high") {
      recommendations.push({
        title: "Immediate Medical Attention",
        priority: "high",
        description:
          "Patient requires immediate medical evaluation due to high/critical risk level. Consider emergency intervention protocols.",
        evidence: [
          `Risk level: ${latestRecord.risk_level}`,
          `Chief complaint: ${latestRecord.chief_complaint}`,
          "Requires continuous monitoring",
        ],
      })
    }

    // Vital signs recommendations
    if (latestRecord.systolic_bp > 140 || latestRecord.diastolic_bp > 90) {
      recommendations.push({
        title: "Hypertension Management",
        priority: "medium",
        description:
          "Blood pressure readings indicate hypertension. Consider antihypertensive therapy and lifestyle modifications.",
        evidence: [
          `BP: ${latestRecord.systolic_bp}/${latestRecord.diastolic_bp} mmHg`,
          "Above normal range (120/80 mmHg)",
          "Monitor for cardiovascular complications",
        ],
      })
    }

    if (latestRecord.oxygen_saturation < 95) {
      recommendations.push({
        title: "Oxygen Therapy Consideration",
        priority: "high",
        description: "Low oxygen saturation may require supplemental oxygen therapy and respiratory assessment.",
        evidence: [
          `O2 Sat: ${latestRecord.oxygen_saturation}%`,
          "Below normal range (95-100%)",
          "Assess respiratory function",
        ],
      })
    }

    // Pain management
    if (latestRecord.pain_scale > 7) {
      recommendations.push({
        title: "Pain Management Protocol",
        priority: "medium",
        description: "High pain score requires comprehensive pain management strategy and regular reassessment.",
        evidence: [
          `Pain scale: ${latestRecord.pain_scale}/10`,
          "Severe pain level",
          "Consider multimodal pain management",
        ],
      })
    }

    return recommendations.slice(0, 3) // Limit to 3 recommendations
  }

  const toggleEvidence = (index) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleDownloadRecords = async () => {
    if (!patientData) return

    try {
      if (USE_MOCK_DATA) {
        const blob = new Blob([JSON.stringify(patientData.patient_records || [], null, 2)], { type: "application/json" })
        downloadBlobAsFile(blob, `patient_${patientData.patient_id}_records.json`)
      } else {
        const response = await fetch("/api/patients/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patientData.id, format: "json" }),
        })
        if (!response.ok) throw new Error("Export failed")
        const blob = await response.blob()
        downloadBlobAsFile(blob, `patient_${patientData.patient_id}_records.json`)
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download records")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault?.()
    const content = chatInput.trim()
    if (!content) return
    const userMsg = { role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setChatInput("")

    try {
      if (!USE_MOCK_DATA) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            patient: patientData || null,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          const assistantMsg = { role: "assistant", content: data.reply || "" }
          setMessages((prev) => [...prev, assistantMsg])
          return
        }
      }

      // Mock reply if backend is unavailable or mock mode on
      const mockReplyParts = []
      mockReplyParts.push("Thanks for your message. This is a demo reply.")
      if (patientData) {
        mockReplyParts.push(
          `Patient ${patientData.first_name} ${patientData.last_name} (${patientData.patient_id}). Latest risk: ${patientData.patient_records?.[0]?.risk_level ?? "n/a"}.`,
        )
      }
      mockReplyParts.push("When the backend is connected, this will stream AI responses.")
      const assistantMsg = { role: "assistant", content: mockReplyParts.join(" ") }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error("Chat error", err)
    }
  }

  return (
    <div className="chatbot-container">
      {/* Search Section */}
      <div className="chatbot-search">
        <form onSubmit={handleSearch} className="chatbot-search-form">
          <div className="chatbot-search-input">
            <label htmlFor="searchQuery" className="form-label">
              Search Patient
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Patient ID (P001) or Name (John Doe)"
              className="form-input"
              disabled={isSearching}
            />
          </div>
          <button type="submit" className="chatbot-search-button" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="chatbot-results">
        {error && (
          <div className="chatbot-results-empty">
            <div style={{ color: "var(--danger-color)", marginBottom: "1rem" }}>❌ {error}</div>
            <p>Try searching with a different Patient ID or name.</p>
          </div>
        )}

        {!patientData && !error && !isSearching && (
          <div className="chatbot-results-empty">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3>Search for a Patient</h3>
            <p>Enter a Patient ID (like P001) or patient name to get AI-powered recommendations and view records.</p>
          </div>
        )}

        {patientData && (
          <>
            {/* Patient Summary */}
            <div className="patient-summary">
              <div className="patient-summary-header">
                <div>
                  <h2 className="patient-name">
                    {patientData.first_name} {patientData.last_name}
                  </h2>
                  <p className="patient-id">Patient ID: {patientData.patient_id}</p>
                  {patientData.date_of_birth && (
                    <p className="patient-id">DOB: {new Date(patientData.date_of_birth).toLocaleDateString()}</p>
                  )}
                  {patientData.gender && <p className="patient-id">Gender: {patientData.gender}</p>}
                </div>
                <button className="download-button" onClick={handleDownloadRecords}>
                  📥 Download Records
                </button>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <strong>Records Found:</strong> {patientData.patient_records?.length || 0}
                {patientData.patient_records?.length > 0 && (
                  <span style={{ marginLeft: "1rem", color: "var(--text-secondary)" }}>
                    Latest: {formatDate(patientData.patient_records[0].created_at)}
                  </span>
                )}
              </div>

              {patientData.patient_records?.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Latest Vitals:</strong>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {patientData.patient_records[0].systolic_bp && (
                      <span>
                        BP: {patientData.patient_records[0].systolic_bp}/{patientData.patient_records[0].diastolic_bp}
                      </span>
                    )}
                    {patientData.patient_records[0].heart_rate && (
                      <span>HR: {patientData.patient_records[0].heart_rate}</span>
                    )}
                    {patientData.patient_records[0].temperature && (
                      <span>Temp: {patientData.patient_records[0].temperature}°F</span>
                    )}
                    {patientData.patient_records[0].oxygen_saturation && (
                      <span>O2: {patientData.patient_records[0].oxygen_saturation}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="recommendations">
                <h3 className="recommendations-title">AI-Generated Care Recommendations</h3>
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-header">
                      <h4 className="recommendation-title">{rec.title}</h4>
                      <span className={`recommendation-priority priority-${rec.priority}`}>{rec.priority}</span>
                    </div>
                    <p className="recommendation-description">{rec.description}</p>
                    <button className="evidence-toggle" onClick={() => toggleEvidence(index)}>
                      {expandedEvidence[index] ? "Hide Evidence" : "Show Evidence"}
                    </button>
                    {expandedEvidence[index] && (
                      <div className="evidence-content">
                        <h5>Supporting Evidence:</h5>
                        <ul className="evidence-list">
                          {rec.evidence.map((item, i) => (
                            <li key={i} className="evidence-item">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Dedicated Chat Area */}
            <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Chat with AI</h3>
                <p className="dashboard-card-description">Ask questions about the selected patient or general care</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    minHeight: "220px",
                    padding: "0.75rem",
                    background: "var(--card)",
                    overflowY: "auto",
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ color: "var(--text-secondary)" }}>Start the conversation below…</div>
                  ) : (
                    messages.map((m, i) => (
                      <div key={i} style={{ marginBottom: "0.5rem" }}>
                        <strong>{m.role === "user" ? "You" : "Assistant"}:</strong> {m.content}
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    className="form-input"
                    placeholder={patientData ? `Ask about ${patientData.first_name}…` : "Ask a medical question…"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">Send</button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChatUI
