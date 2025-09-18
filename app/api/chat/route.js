import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const messages = JSON.parse(formData.get('messages') || '[]')
    const patient = JSON.parse(formData.get('patient') || 'null')
    const imageFile = formData.get('image')
    
    // Check if OpenRouter is available for MedGemma-4B-PT
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (openrouterApiKey) {
      // Use OpenRouter with MedGemma-4B-PT (best medical AI)
      return await handleOpenRouterRequest(messages, patient, imageFile)
    } else {
      // Fallback to free models
      const hasImage = imageFile && imageFile.size > 0
      if (hasImage) {
        return await handleMedGemmaRequest(messages, patient, imageFile)
      } else {
        return await handleTextOnlyRequest(messages, patient)
      }
    }
  } catch (err) {
    console.error("chat api error", err)
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 })
  }
}

async function handleOpenRouterRequest(messages, patient, imageFile) {
  try {
    const formData = new FormData()
    formData.append('messages', JSON.stringify(messages))
    formData.append('patient', JSON.stringify(patient || null))
    if (imageFile) {
      formData.append('image', imageFile)
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/openrouter-medical`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ 
        error: errorData.error || "Unable to process your medical query with MedGemma-4B-PT at this time. Please try again." 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ reply: data.reply })
    
  } catch (error) {
    console.error("OpenRouter MedGemma-4B-PT processing error:", error)
    const fallbackResponse = "I encountered an issue processing your request with MedGemma-4B-PT. Please try again or consult with a medical professional."
    return NextResponse.json({ reply: fallbackResponse })
  }
}

async function handleMedGemmaRequest(messages, patient, imageFile) {
  try {
    const lastMessage = messages[messages.length - 1]
    const query = lastMessage?.content || "Please analyze this medical image and provide clinical insights."
    
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
      }
    }

    // Use free Hugging Face API for image analysis
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    
    if (!hfApiKey) {
      return NextResponse.json({ 
        reply: `**Free Medical Image Analysis**\n\nQuery: ${query}\n\nPatient Context: ${patientContext || 'No patient context available'}\n\nTo analyze medical images, please configure your HUGGINGFACE_API_KEY in the .env.local file. Hugging Face offers free access to medical image analysis models.\n\n**Setup:** Get your free API key from https://huggingface.co/settings/tokens` 
      })
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`

    // Use free medical image analysis model
    const response = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageDataUrl,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.1
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Image analysis API error: ${response.status}`)
    }

    const result = await response.json()
    
    let imageDescription = ""
    if (Array.isArray(result) && result[0]?.generated_text) {
      imageDescription = result[0].generated_text
    } else {
      imageDescription = "Medical image analysis completed. Please consult with a medical professional for detailed interpretation."
    }

    // Now use Llama 3.1 8B to provide medical context for the image
    const groqApiKey = process.env.GROQ_API_KEY
    let medicalAnalysis = imageDescription

    if (groqApiKey) {
      const medicalPrompt = `You are a medical AI assistant. Based on this image description: "${imageDescription}", and the patient query: "${query}", provide clinical insights and recommendations. Consider the patient context: ${patientContext || 'No patient context available'}. Be precise and suggest appropriate next steps. Do not provide definitive diagnoses.`

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a medical AI assistant. Provide clinical insights based on image descriptions and patient queries. Be precise and suggest appropriate next steps."
            },
            {
              role: "user",
              content: medicalPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      })

      if (groqResponse.ok) {
        const groqData = await groqResponse.json()
        medicalAnalysis = groqData.choices?.[0]?.message?.content || imageDescription
      }
    }

    const finalResponse = `**Free Medical Image Analysis**\n\n**Image Description:** ${imageDescription}\n\n**Medical Analysis:** ${medicalAnalysis}\n\n**Query:** ${query}\n\n**Patient Context:** ${patientContext || 'No patient context available'}\n\n**Disclaimer:** This is an AI-generated analysis for informational purposes only. Always consult with qualified medical professionals for diagnosis and treatment decisions.`

    return NextResponse.json({ reply: finalResponse })
    
  } catch (error) {
    console.error("Image analysis error:", error)
    const fallbackResponse = "I encountered an issue analyzing your medical image. Please try again or consult with a medical professional for image interpretation."
    return NextResponse.json({ reply: fallbackResponse })
  }
}

async function handleTextOnlyRequest(messages, patient) {
  const apiKey = process.env.GROQ_API_KEY

  // Enhanced medical system prompt for Llama 3.1 8B
  const system = `You are a medical AI assistant powered by Llama 3.1 8B, designed to help healthcare professionals with clinical decision support. You have extensive medical knowledge and can provide evidence-based guidance.

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

  if (!apiKey) {
    const last = messages[messages.length - 1]?.content || ""
    const fallback = patient
      ? `**Free Medical AI Assistant**\n\nPatient: ${patient.first_name} ${patient.last_name} (${patient.patient_id})\n\nQuestion: ${last}\n\nTo get AI-powered medical responses, please configure your GROQ_API_KEY in the .env.local file. Groq offers free access to Llama 3.1 8B, which provides excellent medical AI capabilities.\n\n**Setup:** Get your free API key from https://console.groq.com/`
      : `**Free Medical AI Assistant**\n\nQuestion: ${last}\n\nTo get AI-powered medical responses, please configure your GROQ_API_KEY in the .env.local file. Groq offers free access to Llama 3.1 8B, which provides excellent medical AI capabilities.\n\n**Setup:** Get your free API key from https://console.groq.com/`
    return NextResponse.json({ reply: fallback })
  }

  // Prepare enhanced patient context
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

  // Filter out any image content from messages for text-only models
  const textOnlyMessages = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return msg
    } else if (Array.isArray(msg.content)) {
      // Extract only text content, ignore image content
      const textContent = msg.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join(' ')
      return {
        ...msg,
        content: textContent || "Please analyze the uploaded image."
      }
    }
    return msg
  }).filter(msg => msg.content && msg.content.trim() !== '')

  const payloadMsgs = [
    { role: "system", content: system },
    ...(patientContext ? [{ role: "user", content: `Patient Context: ${patientContext}` }] : []),
    ...textOnlyMessages,
  ]

  console.log("Using Llama 3.1 8B for medical query via Groq (FREE)")

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: payloadMsgs,
      temperature: 0.1, // Lower temperature for more consistent medical responses
      max_tokens: 1000,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Groq API error: ${res.status}`, errorText)
    return NextResponse.json({ 
      error: `Medical AI service error (${res.status}): ${errorText}` 
    }, { status: 500 })
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content || ""
  
  // Add medical disclaimer and context
  const enhancedReply = `**Llama 3.1 8B Medical AI Response**\n\n${reply}\n\n**Patient Context:** ${patientContext || 'No patient context available'}\n\n**Disclaimer:** This is an AI-generated response for informational purposes only. Always consult with qualified medical professionals for diagnosis and treatment decisions.`
  
  return NextResponse.json({ 
    reply: enhancedReply,
    model: "Llama 3.1 8B (Free via Groq)",
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0
    }
  })
}


