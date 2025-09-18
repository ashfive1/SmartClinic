import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { messages = [], patient = null } = await request.json()
    const apiKey = process.env.OPENAI_API_KEY

    const system = `You are an assistant for clinicians. When a patient object is provided, tailor answers using those details. Be concise, cite vitals where helpful, and avoid providing diagnosis. If unsure, suggest next steps. Do not include PHI beyond what is provided in the prompt.`

    if (!apiKey) {
      const last = messages[messages.length - 1]?.content || ""
      const fallback = patient
        ? `This is a demo response. Patient ${patient.first_name} ${patient.last_name} (${patient.patient_id}). Ask about vitals, risks, or care steps.`
        : `This is a demo response. Provide a patient to get contextual guidance.`
      return NextResponse.json({ reply: `${fallback} You asked: ${last}` })
    }

    const payloadMsgs = [
      { role: "system", content: system },
      ...(patient ? [{ role: "user", content: `Patient context: ${JSON.stringify(patient)}` }] : []),
      ...messages,
    ]

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: payloadMsgs,
        temperature: 0.2,
      }),
    })

    if (!res.ok) throw new Error("LLM request failed")
    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || ""
    return NextResponse.json({ reply })
  } catch (err) {
    console.error("chat api error", err)
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 })
  }
}


