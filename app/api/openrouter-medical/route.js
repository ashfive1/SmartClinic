import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const messages = JSON.parse(formData.get('messages') || '[]')
    const patient = JSON.parse(formData.get('patient') || 'null')
    const imageFile = formData.get('image')
    
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (!openrouterApiKey) {
      return NextResponse.json({ 
        error: "OPENROUTER_API_KEY is required. Please configure your API key in .env.local file." 
      }, { status: 401 })
    }

    const lastMessage = messages[messages.length - 1]?.content || ""
    
    // Prepare patient context
    let patientContext = ""
    if (patient) {
      patientContext = `Patient: ${patient.first_name} ${patient.last_name} (${patient.patient_id})`
      if (patient.patient_records?.[0]) {
        const latestRecord = patient.patient_records[0]
        patientContext += `\nLatest vitals: BP ${latestRecord.systolic_bp}/${latestRecord.diastolic_bp}, HR ${latestRecord.heart_rate}, Temp ${latestRecord.temperature}°F`
        patientContext += `\nRisk level: ${latestRecord.risk_level}`
        if (latestRecord.chief_complaint) {
          patientContext += `\nChief complaint: ${latestRecord.chief_complaint}`
        }
        if (latestRecord.symptoms) {
          patientContext += `\nSymptoms: ${latestRecord.symptoms}`
        }
        if (latestRecord.medical_history) {
          patientContext += `\nMedical history: ${latestRecord.medical_history}`
        }
      }
    }

    let medicalResponse = ""

    if (imageFile && imageFile.size > 0) {
      // Handle image analysis with OpenRouter
      const imageBuffer = await imageFile.arrayBuffer()
      const imageBase64 = Buffer.from(imageBuffer).toString('base64')
      const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`

      const systemPrompt = `You are MedGemma-4B-PT, a specialized medical AI assistant designed for clinical decision support. Analyze the provided medical image and provide clinical insights. Be precise, cite relevant medical observations, and suggest appropriate next steps. Do not provide definitive diagnoses - only clinical observations and recommendations.`

      const userPrompt = `${lastMessage}\n\n${patientContext ? `Patient Context: ${patientContext}` : ''}`

      // Use Google Gemma 3N E4B IT for medical image analysis (free model with vision capabilities)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
          "X-Title": "CliniSmart Medical AI"
        },
        body: JSON.stringify({
          model: "google/gemma-3n-e4b-it:free",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageDataUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      medicalResponse = result.choices[0]?.message?.content || "Unable to analyze the medical image."

    } else {
      // Handle text-only queries with best medical model on OpenRouter
      const systemPrompt = `You are MedGemma-4B-PT, a specialized medical AI assistant designed for clinical decision support. You have extensive medical knowledge and can provide evidence-based guidance for healthcare professionals.

Key capabilities:
- Analyze patient symptoms and vital signs
- Suggest differential diagnoses and next steps
- Provide clinical reasoning and medical insights
- Recommend appropriate tests and treatments
- Explain medical conditions and procedures

Guidelines:
- Always emphasize that you provide clinical support, not definitive diagnoses
- Recommend consulting with qualified medical professionals
- Be precise and cite relevant medical information
- Consider patient context and medical history
- Suggest appropriate follow-up actions
- Maintain patient privacy and confidentiality

When a patient object is provided, use that context to tailor your responses with relevant clinical insights.`

      const userPrompt = `${patientContext ? `Patient Context: ${patientContext}\n\n` : ''}Question: ${lastMessage}`

      // Use Google Gemma 3N E4B IT for medical text analysis (free and excellent for medical applications)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
          "X-Title": "CliniSmart Medical AI"
        },
        body: JSON.stringify({
          model: "google/gemma-3n-e4b-it:free",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      medicalResponse = result.choices[0]?.message?.content || "Unable to process your medical query."
    }

    const finalResponse = `**Gemma 3N E4B IT Medical AI Response**\n\n${medicalResponse}\n\n**Patient Context:** ${patientContext || 'No patient context available'}\n\n**Disclaimer:** This is an AI-generated response for informational purposes only. Always consult with qualified medical professionals for diagnosis and treatment decisions.`

    return NextResponse.json({ 
      reply: finalResponse,
      model: "Google Gemma 3N E4B IT (Free via OpenRouter)",
      timestamp: new Date().toISOString(),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    })
    
  } catch (error) {
    console.error("OpenRouter medical AI error:", error)
    
    // Handle specific OpenRouter errors
    if (error.message.includes('insufficient_credits')) {
      return NextResponse.json({ 
        error: "OpenRouter credits insufficient. Please add credits to your account." 
      }, { status: 402 })
    }
    
    if (error.message.includes('rate_limit')) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Please try again in a moment." 
      }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: "Failed to process medical query with MedGemma-4B-PT",
      details: error.message 
    }, { status: 500 })
  }
}
