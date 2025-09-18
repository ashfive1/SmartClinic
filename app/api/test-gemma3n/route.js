import { NextResponse } from "next/server"

export async function GET() {
  try {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    return NextResponse.json({
      status: "success",
      keys: {
        openrouter: {
          configured: !!openrouterApiKey,
          keyLength: openrouterApiKey ? openrouterApiKey.length : 0,
          model: "google/gemma-3n-e4b-it:free"
        }
      },
      message: "Google Gemma 3N E4B IT configuration checked successfully"
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
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (!openrouterApiKey) {
      return NextResponse.json({ 
        error: "OPENROUTER_API_KEY not configured" 
      }, { status: 401 })
    }

    // Test the Google Gemma 3N E4B IT model with a medical query
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
            content: "You are a medical AI assistant. Provide brief, helpful medical information."
          },
          {
            role: "user",
            content: "What are the main symptoms of hypertension?"
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: `OpenRouter API error: ${response.status}`,
        details: errorText
      }, { status: 500 })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      test_query: "What are the main symptoms of hypertension?",
      response: result.choices[0]?.message?.content || "No response received",
      model: "google/gemma-3n-e4b-it:free",
      usage: result.usage,
      message: "Google Gemma 3N E4B IT is working correctly!"
    })

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error.message
    }, { status: 500 })
  }
}
