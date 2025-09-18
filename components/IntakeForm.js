"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { USE_MOCK_DATA, MockData } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import "../styles/forms.css"

const IntakeForm = () => {
  const { profile } = useAuth()
  const supabase = USE_MOCK_DATA ? null : createClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [patientData, setPatientData] = useState({
    // Patient Info
    patientId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalRecordNumber: "",

    // Vital Signs
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",

    // Assessment
    consciousnessLevel: "alert",
    painScale: "",

    // Clinical Data
    chiefComplaint: "",
    symptoms: "",
    allergies: "",
    currentMedications: "",
    medicalHistory: "",
    riskLevel: "low",
    notes: "",
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPatientData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!patientData.patientId.trim()) newErrors.patientId = "Patient ID is required"
    if (!patientData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!patientData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!patientData.chiefComplaint.trim()) newErrors.chiefComplaint = "Chief complaint is required"

    // Validate vital signs ranges
    if (patientData.systolicBp && (patientData.systolicBp < 70 || patientData.systolicBp > 250)) {
      newErrors.systolicBp = "Systolic BP should be between 70-250 mmHg"
    }
    if (patientData.diastolicBp && (patientData.diastolicBp < 40 || patientData.diastolicBp > 150)) {
      newErrors.diastolicBp = "Diastolic BP should be between 40-150 mmHg"
    }
    if (patientData.heartRate && (patientData.heartRate < 30 || patientData.heartRate > 200)) {
      newErrors.heartRate = "Heart rate should be between 30-200 bpm"
    }
    if (patientData.temperature && (patientData.temperature < 90 || patientData.temperature > 110)) {
      newErrors.temperature = "Temperature should be between 90-110°F"
    }
    if (patientData.respiratoryRate && (patientData.respiratoryRate < 8 || patientData.respiratoryRate > 40)) {
      newErrors.respiratoryRate = "Respiratory rate should be between 8-40 breaths/min"
    }
    if (patientData.oxygenSaturation && (patientData.oxygenSaturation < 70 || patientData.oxygenSaturation > 100)) {
      newErrors.oxygenSaturation = "Oxygen saturation should be between 70-100%"
    }
    if (patientData.painScale && (patientData.painScale < 0 || patientData.painScale > 10)) {
      newErrors.painScale = "Pain scale should be between 0-10"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please correct the errors below" })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    try {
      if (USE_MOCK_DATA) {
        // Simulate creating or finding a patient in mock store
        let patient = MockData.patients.find((p) => p.patient_id === patientData.patientId)
        if (!patient) {
          patient = {
            id: Math.random().toString(36).slice(2),
            patient_id: patientData.patientId,
            first_name: patientData.firstName,
            last_name: patientData.lastName,
            date_of_birth: patientData.dateOfBirth || null,
            gender: patientData.gender || null,
            phone: patientData.phone || null,
            email: patientData.email || null,
            created_at: new Date().toISOString(),
            patient_records: [],
          }
          MockData.patients.push(patient)
        }
        const newRecord = {
          id: Math.random().toString(36).slice(2),
          created_at: new Date().toISOString(),
          systolic_bp: patientData.systolicBp ? Number.parseInt(patientData.systolicBp) : null,
          diastolic_bp: patientData.diastolicBp ? Number.parseInt(patientData.diastolicBp) : null,
          heart_rate: patientData.heartRate ? Number.parseInt(patientData.heartRate) : null,
          temperature: patientData.temperature ? Number.parseFloat(patientData.temperature) : null,
          respiratory_rate: patientData.respiratoryRate ? Number.parseInt(patientData.respiratoryRate) : null,
          oxygen_saturation: patientData.oxygenSaturation ? Number.parseInt(patientData.oxygenSaturation) : null,
          consciousness_level: patientData.consciousnessLevel,
          pain_scale: patientData.painScale ? Number.parseInt(patientData.painScale) : null,
          chief_complaint: patientData.chiefComplaint,
          symptoms: patientData.symptoms || null,
          allergies: patientData.allergies || null,
          current_medications: patientData.currentMedications || null,
          medical_history: patientData.medicalHistory || null,
          risk_level: patientData.riskLevel,
          notes: patientData.notes || null,
        }
        patient.patient_records.unshift(newRecord)
      } else {
        // First, check if patient exists or create new patient
        let patientRecord
        const { data: existingPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("patient_id", patientData.patientId)
          .single()

        if (existingPatient) {
          patientRecord = existingPatient
        } else {
          const { data: newPatient, error: patientError } = await supabase
            .from("patients")
            .insert({
              patient_id: patientData.patientId,
              first_name: patientData.firstName,
              last_name: patientData.lastName,
              date_of_birth: patientData.dateOfBirth || null,
              gender: patientData.gender || null,
              phone: patientData.phone || null,
              email: patientData.email || null,
              emergency_contact_name: patientData.emergencyContactName || null,
              emergency_contact_phone: patientData.emergencyContactPhone || null,
              medical_record_number: patientData.medicalRecordNumber || null,
            })
            .select("id")
            .single()
          if (patientError) throw patientError
          patientRecord = newPatient
        }
        const { error: recordError } = await supabase.from("patient_records").insert({
          patient_id: patientRecord.id,
          recorded_by: profile.id,
          systolic_bp: patientData.systolicBp ? Number.parseInt(patientData.systolicBp) : null,
          diastolic_bp: patientData.diastolicBp ? Number.parseInt(patientData.diastolicBp) : null,
          heart_rate: patientData.heartRate ? Number.parseInt(patientData.heartRate) : null,
          temperature: patientData.temperature ? Number.parseFloat(patientData.temperature) : null,
          respiratory_rate: patientData.respiratoryRate ? Number.parseInt(patientData.respiratoryRate) : null,
          oxygen_saturation: patientData.oxygenSaturation ? Number.parseInt(patientData.oxygenSaturation) : null,
          consciousness_level: patientData.consciousnessLevel,
          pain_scale: patientData.painScale ? Number.parseInt(patientData.painScale) : null,
          chief_complaint: patientData.chiefComplaint,
          symptoms: patientData.symptoms || null,
          allergies: patientData.allergies || null,
          current_medications: patientData.currentMedications || null,
          medical_history: patientData.medicalHistory || null,
          risk_level: patientData.riskLevel,
          notes: patientData.notes || null,
        })
        if (recordError) throw recordError

        // Trigger AI rating generation for this patient
        try {
          await fetch("/api/patients/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patientId: patientRecord.id, onlyMissing: true }),
          })
        } catch (_) {}
      }

      setMessage({ type: "success", text: "Patient intake record created successfully!" })

      // Reset form
      setPatientData({
        patientId: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        medicalRecordNumber: "",
        systolicBp: "",
        diastolicBp: "",
        heartRate: "",
        temperature: "",
        respiratoryRate: "",
        oxygenSaturation: "",
        consciousnessLevel: "alert",
        painScale: "",
        chiefComplaint: "",
        symptoms: "",
        allergies: "",
        currentMedications: "",
        medicalHistory: "",
        riskLevel: "low",
        notes: "",
      })
    } catch (error) {
      console.error("Error creating patient record:", error)
      setMessage({ type: "error", text: error.message || "An error occurred while saving the record" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div>
        )}

        {/* Patient Information */}
        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <legend style={{ fontWeight: "600", fontSize: "1.125rem", padding: "0 0.5rem" }}>Patient Information</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientId" className="form-label">
                Patient ID *
              </label>
              <input
                type="text"
                id="patientId"
                name="patientId"
                value={patientData.patientId}
                onChange={handleInputChange}
                className={`form-input ${errors.patientId ? "error" : ""}`}
                placeholder="P001"
              />
              {errors.patientId && <div className="form-error">{errors.patientId}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="medicalRecordNumber" className="form-label">
                Medical Record Number
              </label>
              <input
                type="text"
                id="medicalRecordNumber"
                name="medicalRecordNumber"
                value={patientData.medicalRecordNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="MRN001"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={patientData.firstName}
                onChange={handleInputChange}
                className={`form-input ${errors.firstName ? "error" : ""}`}
              />
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={patientData.lastName}
                onChange={handleInputChange}
                className={`form-input ${errors.lastName ? "error" : ""}`}
              />
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={patientData.dateOfBirth}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={patientData.gender}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={patientData.phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="555-0123"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={patientData.email}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergencyContactName" className="form-label">
                Emergency Contact Name
              </label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={patientData.emergencyContactName}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContactPhone" className="form-label">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                value={patientData.emergencyContactPhone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="555-0123"
              />
            </div>
          </div>
        </fieldset>

        {/* Vital Signs */}
        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <legend style={{ fontWeight: "600", fontSize: "1.125rem", padding: "0 0.5rem" }}>Vital Signs</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="systolicBp" className="form-label">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                id="systolicBp"
                name="systolicBp"
                value={patientData.systolicBp}
                onChange={handleInputChange}
                className={`form-input ${errors.systolicBp ? "error" : ""}`}
                min="70"
                max="250"
                placeholder="120"
              />
              {errors.systolicBp && <div className="form-error">{errors.systolicBp}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="diastolicBp" className="form-label">
                Diastolic BP (mmHg)
              </label>
              <input
                type="number"
                id="diastolicBp"
                name="diastolicBp"
                value={patientData.diastolicBp}
                onChange={handleInputChange}
                className={`form-input ${errors.diastolicBp ? "error" : ""}`}
                min="40"
                max="150"
                placeholder="80"
              />
              {errors.diastolicBp && <div className="form-error">{errors.diastolicBp}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="heartRate" className="form-label">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                id="heartRate"
                name="heartRate"
                value={patientData.heartRate}
                onChange={handleInputChange}
                className={`form-input ${errors.heartRate ? "error" : ""}`}
                min="30"
                max="200"
                placeholder="72"
              />
              {errors.heartRate && <div className="form-error">{errors.heartRate}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="temperature" className="form-label">
                Temperature (°F)
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={patientData.temperature}
                onChange={handleInputChange}
                className={`form-input ${errors.temperature ? "error" : ""}`}
                min="90"
                max="110"
                step="0.1"
                placeholder="98.6"
              />
              {errors.temperature && <div className="form-error">{errors.temperature}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="respiratoryRate" className="form-label">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                id="respiratoryRate"
                name="respiratoryRate"
                value={patientData.respiratoryRate}
                onChange={handleInputChange}
                className={`form-input ${errors.respiratoryRate ? "error" : ""}`}
                min="8"
                max="40"
                placeholder="16"
              />
              {errors.respiratoryRate && <div className="form-error">{errors.respiratoryRate}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="oxygenSaturation" className="form-label">
                Oxygen Saturation (%)
              </label>
              <input
                type="number"
                id="oxygenSaturation"
                name="oxygenSaturation"
                value={patientData.oxygenSaturation}
                onChange={handleInputChange}
                className={`form-input ${errors.oxygenSaturation ? "error" : ""}`}
                min="70"
                max="100"
                placeholder="98"
              />
              {errors.oxygenSaturation && <div className="form-error">{errors.oxygenSaturation}</div>}
            </div>
          </div>
        </fieldset>

        {/* Assessment */}
        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <legend style={{ fontWeight: "600", fontSize: "1.125rem", padding: "0 0.5rem" }}>Assessment</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="consciousnessLevel" className="form-label">
                Consciousness Level
              </label>
              <select
                id="consciousnessLevel"
                name="consciousnessLevel"
                value={patientData.consciousnessLevel}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="alert">Alert</option>
                <option value="verbal">Verbal</option>
                <option value="pain">Pain</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="painScale" className="form-label">
                Pain Scale (0-10)
              </label>
              <input
                type="number"
                id="painScale"
                name="painScale"
                value={patientData.painScale}
                onChange={handleInputChange}
                className={`form-input ${errors.painScale ? "error" : ""}`}
                min="0"
                max="10"
                placeholder="0"
              />
              {errors.painScale && <div className="form-error">{errors.painScale}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="riskLevel" className="form-label">
                Risk Level
              </label>
              <select
                id="riskLevel"
                name="riskLevel"
                value={patientData.riskLevel}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Clinical Data */}
        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <legend style={{ fontWeight: "600", fontSize: "1.125rem", padding: "0 0.5rem" }}>Clinical Data</legend>

          <div className="form-group">
            <label htmlFor="chiefComplaint" className="form-label">
              Chief Complaint *
            </label>
            <textarea
              id="chiefComplaint"
              name="chiefComplaint"
              value={patientData.chiefComplaint}
              onChange={handleInputChange}
              className={`form-input ${errors.chiefComplaint ? "error" : ""}`}
              rows="3"
              placeholder="Primary reason for visit"
            />
            {errors.chiefComplaint && <div className="form-error">{errors.chiefComplaint}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="symptoms" className="form-label">
              Symptoms
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              value={patientData.symptoms}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Describe current symptoms"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="allergies" className="form-label">
                Allergies
              </label>
              <textarea
                id="allergies"
                name="allergies"
                value={patientData.allergies}
                onChange={handleInputChange}
                className="form-input"
                rows="2"
                placeholder="Known allergies"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentMedications" className="form-label">
                Current Medications
              </label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                value={patientData.currentMedications}
                onChange={handleInputChange}
                className="form-input"
                rows="2"
                placeholder="Current medications and dosages"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="medicalHistory" className="form-label">
              Medical History
            </label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              value={patientData.medicalHistory}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Relevant medical history"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={patientData.notes}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Additional observations or notes"
            />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => window.history.back()}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Patient Record"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default IntakeForm
