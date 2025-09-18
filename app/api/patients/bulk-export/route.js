import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    const { patientIds, format = "json" } = await request.json()

    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return NextResponse.json({ error: "Patient IDs array is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Get patients data with all records
    const { data: patients, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        patient_records (
          *,
          profiles (
            full_name,
            role
          )
        )
      `,
      )
      .in("id", patientIds)
      .order("created_at", { ascending: false })

    if (error) throw error

    if (format === "csv") {
      const csv = convertPatientsToCSV(patients)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="patients_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      const jsonData = JSON.stringify(patients, null, 2)
      return new NextResponse(jsonData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="patients_export_${new Date().toISOString().split("T")[0]}.json"`,
        },
      })
    }
  } catch (error) {
    console.error("Bulk export error:", error)
    return NextResponse.json({ error: "Failed to export patient records" }, { status: 500 })
  }
}

function convertPatientsToCSV(patients) {
  const headers = [
    "Patient ID",
    "First Name",
    "Last Name",
    "Date of Birth",
    "Gender",
    "Phone",
    "Email",
    "Emergency Contact",
    "Emergency Phone",
    "Medical Record Number",
    "Record Date",
    "Systolic BP",
    "Diastolic BP",
    "Heart Rate",
    "Temperature",
    "Respiratory Rate",
    "O2 Saturation",
    "Consciousness",
    "Pain Scale",
    "Chief Complaint",
    "Symptoms",
    "Allergies",
    "Current Medications",
    "Medical History",
    "Risk Level",
    "Notes",
    "Recorded By",
  ]

  const rows = []

  patients.forEach((patient) => {
    if (patient.patient_records && patient.patient_records.length > 0) {
      patient.patient_records.forEach((record) => {
        rows.push([
          patient.patient_id,
          patient.first_name,
          patient.last_name,
          patient.date_of_birth || "",
          patient.gender || "",
          patient.phone || "",
          patient.email || "",
          patient.emergency_contact_name || "",
          patient.emergency_contact_phone || "",
          patient.medical_record_number || "",
          new Date(record.created_at).toLocaleDateString(),
          record.systolic_bp || "",
          record.diastolic_bp || "",
          record.heart_rate || "",
          record.temperature || "",
          record.respiratory_rate || "",
          record.oxygen_saturation || "",
          record.consciousness_level || "",
          record.pain_scale || "",
          record.chief_complaint || "",
          record.symptoms || "",
          record.allergies || "",
          record.current_medications || "",
          record.medical_history || "",
          record.risk_level || "",
          record.notes || "",
          record.profiles?.full_name || "",
        ])
      })
    } else {
      // Patient with no records
      rows.push([
        patient.patient_id,
        patient.first_name,
        patient.last_name,
        patient.date_of_birth || "",
        patient.gender || "",
        patient.phone || "",
        patient.email || "",
        patient.emergency_contact_name || "",
        patient.emergency_contact_phone || "",
        patient.medical_record_number || "",
        "", // No record date
        "", // No vitals
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ])
    }
  })

  const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

  return csvContent
}
