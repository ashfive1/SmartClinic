import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    const { patientId, format = "json" } = await request.json()

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Get patient data with all records
    const { data: patient, error } = await supabase
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
      .eq("id", patientId)
      .single()

    if (error) throw error

    if (format === "csv") {
      const csv = convertToCSV(patient)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="patient_${patient.patient_id}_records.csv"`,
        },
      })
    } else {
      // JSON format
      const jsonData = JSON.stringify(patient, null, 2)
      return new NextResponse(jsonData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="patient_${patient.patient_id}_records.json"`,
        },
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export patient records" }, { status: 500 })
  }
}

function convertToCSV(patient) {
  const headers = [
    "Record Date",
    "Patient ID",
    "Patient Name",
    "Systolic BP",
    "Diastolic BP",
    "Heart Rate",
    "Temperature",
    "Respiratory Rate",
    "O2 Saturation",
    "Consciousness",
    "Pain Scale",
    "Chief Complaint",
    "Risk Level",
    "Recorded By",
  ]

  const rows = patient.patient_records.map((record) => [
    new Date(record.created_at).toLocaleDateString(),
    patient.patient_id,
    `${patient.first_name} ${patient.last_name}`,
    record.systolic_bp || "",
    record.diastolic_bp || "",
    record.heart_rate || "",
    record.temperature || "",
    record.respiratory_rate || "",
    record.oxygen_saturation || "",
    record.consciousness_level || "",
    record.pain_scale || "",
    record.chief_complaint || "",
    record.risk_level || "",
    record.profiles?.full_name || "",
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

  return csvContent
}
