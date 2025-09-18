import { NextResponse } from "next/server"

export async function GET() {
  try {
    const groqApiKey = process.env.GROQ_API_KEY
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    
    return NextResponse.json({
      status: "success",
      keys: {
        groq: {
          configured: !!groqApiKey,
          keyLength: groqApiKey ? groqApiKey.length : 0,
          model: "llama-3.1-8b-instant"
        },
        huggingface: {
          configured: !!hfApiKey,
          keyLength: hfApiKey ? hfApiKey.length : 0,
          model: "blip-image-captioning-base"
        }
      },
      message: "Free Medical AI configuration checked successfully"
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Failed to check configuration",
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!groqApiKey) {
      return NextResponse.json({ 
        error: "GROQ_API_KEY not configured" 
      }, { status: 401 })
    }

    // Test the free medical AI with a simple query
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: "You are a medical AI assistant. Provide brief, helpful medical information."
          },
          {
            role: "user",
            content: "What are the main symptoms of hypertension?"
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: `Groq API error: ${response.status}`,
        details: errorText
      }, { status: 500 })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      test_query: "What are the main symptoms of hypertension?",
      response: result.choices[0]?.message?.content || "No response received",
      model: "llama-3.1-8b-instant",
      usage: result.usage,
      message: "Free Medical AI is working correctly!"
    })

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error.message
    }, { status: 500 })
  }
}
