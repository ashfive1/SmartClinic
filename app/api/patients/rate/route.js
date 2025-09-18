import { NextResponse } from "next/server"
import { createClient as createSb } from "@supabase/supabase-js"

const supabase = createSb(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function callLlmForRating(payload) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    // Fallback heuristic if no key configured
    const latest = payload.latestRecord || {}
    let rating = "low"
    if (latest.risk_level === "critical") rating = "critical"
    else if (latest.risk_level === "high") rating = "high"
    else if (latest.risk_level === "medium") rating = "medium"
    const summary = latest.chief_complaint || "No summary available"
    return { rating, summary }
  }

  const system = `You are a clinical triage assistant. Classify patient risk into one of: low, medium, high, critical. Provide a concise 1-sentence clinical summary. Return strict JSON {"rating":"low|medium|high|critical","summary":"..."}.`
  const user = JSON.stringify(payload)
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    }),
  })
  if (!res.ok) throw new Error("LLM request failed")
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || "{}"
  try {
    const parsed = JSON.parse(text)
    let rating = String(parsed.rating || "").toLowerCase()
    if (!["low", "medium", "high", "critical"].includes(rating)) rating = "low"
    return { rating, summary: parsed.summary || "" }
  } catch (_) {
    return { rating: "low", summary: "" }
  }
}

export async function POST(request) {
  try {
    const { onlyMissing = true, limit = 50, patientId = null } = await request.json().catch(() => ({}))

    // Load patients with latest record and existing ratings
    let query = supabase
      .from("patients")
      .select(
        `id, patient_id, first_name, last_name, date_of_birth, gender,
         patient_ratings (id, created_at, rating, summary),
         patient_records (id, created_at, risk_level, chief_complaint, systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_saturation, respiratory_rate, pain_scale, consciousness_level)`
      )
      .order("created_at", { ascending: false })

    if (patientId) {
      query = query.eq("id", patientId)
    } else {
      query = query.limit(limit)
    }

    const { data: patients, error } = await query

    if (error) throw error

    const toProcess = (patients || []).filter((p) => !onlyMissing || (p.patient_ratings || []).length === 0)

    const results = []
    for (const p of toProcess) {
      const latestRecord = (p.patient_records || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      const payload = {
        id: p.id,
        patient_id: p.patient_id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        date_of_birth: p.date_of_birth,
        gender: p.gender,
        latestRecord,
      }
      const { rating, summary } = await callLlmForRating(payload)
      const { error: insErr } = await supabase.from("patient_ratings").insert({
        patient_id: p.id,
        rating,
        summary,
      })
      if (insErr) throw insErr
      results.push({ patient_id: p.patient_id, rating, summary })
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (err) {
    console.error("ratings backfill error", err)
    return NextResponse.json({ error: "Failed to backfill ratings" }, { status: 500 })
  }
}


