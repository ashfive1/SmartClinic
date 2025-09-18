import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mock mode flag. Set to false to use Supabase data across the app.
export const USE_MOCK_DATA = false

export function downloadBlobAsFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export function generateCsvFromObjects(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return ""
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return ""
    const s = typeof val === "string" ? val : JSON.stringify(val)
    const needsQuotes = /[\n,\"]/.test(s)
    const escaped = s.replace(/\"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => escape((row as any)[h])).join(","))
  }
  return lines.join("\n")
}

export const MockData = {
  patients: [
    {
      id: "1",
      patient_id: "P001",
      first_name: "John",
      last_name: "Doe",
      date_of_birth: new Date(1980, 5, 12).toISOString(),
      gender: "Male",
      phone: "555-0001",
      email: "john.doe@example.com",
      created_at: new Date().toISOString(),
      patient_records: [
        {
          id: "r1",
          created_at: new Date().toISOString(),
          systolic_bp: 150,
          diastolic_bp: 95,
          heart_rate: 88,
          temperature: 99.1,
          respiratory_rate: 18,
          oxygen_saturation: 93,
          consciousness_level: "alert",
          pain_scale: 3,
          chief_complaint: "Headache and dizziness",
          symptoms: "headache, dizziness",
          allergies: "penicillin",
          current_medications: "ibuprofen",
          medical_history: "hypertension",
          risk_level: "high",
          notes: "monitor closely",
        },
      ],
    },
    {
      id: "2",
      patient_id: "P002",
      first_name: "Jane",
      last_name: "Smith",
      date_of_birth: new Date(1992, 9, 3).toISOString(),
      gender: "Female",
      phone: "555-0002",
      email: "jane.smith@example.com",
      created_at: new Date().toISOString(),
      patient_records: [
        {
          id: "r2",
          created_at: new Date().toISOString(),
          systolic_bp: 118,
          diastolic_bp: 76,
          heart_rate: 70,
          temperature: 98.4,
          respiratory_rate: 16,
          oxygen_saturation: 98,
          consciousness_level: "alert",
          pain_scale: 1,
          chief_complaint: "Routine check",
          symptoms: "",
          allergies: "none",
          current_medications: "vitamins",
          medical_history: "",
          risk_level: "low",
          notes: "",
        },
      ],
    },
    {
      id: "3",
      patient_id: "P003",
      first_name: "Carlos",
      last_name: "Gonzalez",
      date_of_birth: new Date(1975, 1, 22).toISOString(),
      gender: "Male",
      phone: "555-0003",
      email: "carlos.g@example.com",
      created_at: new Date().toISOString(),
      patient_records: [
        {
          id: "r3",
          created_at: new Date().toISOString(),
          systolic_bp: 110,
          diastolic_bp: 70,
          heart_rate: 60,
          temperature: 98.2,
          respiratory_rate: 14,
          oxygen_saturation: 99,
          consciousness_level: "alert",
          pain_scale: 0,
          chief_complaint: "Follow-up",
          symptoms: "",
          allergies: "latex",
          current_medications: "beta blocker",
          medical_history: "CAD",
          risk_level: "medium",
          notes: "",
        },
      ],
    },
  ],
}
