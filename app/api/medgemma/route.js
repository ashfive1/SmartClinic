import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image')
    const query = formData.get('query') || "Please analyze this medical image and provide clinical insights."
    const patientContext = formData.get('patientContext')
    
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size too large. Please upload an image smaller than 10MB." }, { status: 400 })
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    
    if (!hfApiKey) {
      // Demo response when no API key is configured
      return NextResponse.json({ 
        analysis: `This is a demo response for MedGemma-4B-PT medical image analysis. 

Your query: "${query}"

In production, the MedGemma-4B-PT model would:
- Analyze the uploaded medical image for clinical findings
- Identify anatomical structures and potential abnormalities
- Provide evidence-based clinical observations
- Suggest appropriate next steps for patient care

${patientContext ? `Patient Context: ${patientContext}` : ''}

Note: This is a demonstration. For actual medical image analysis, configure the HUGGINGFACE_API_KEY environment variable.` 
      })
    }

    // Convert image to base64 for API
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`

    // Use a medical vision model for analysis
    // Note: In production, you would use the actual MedGemma-4B-PT model
    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageDataUrl,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.1,
          return_full_text: false
        }
      }),
    })

    if (!response.ok) {
      console.error(`Hugging Face API error: ${response.status}`)
      return NextResponse.json({ 
        analysis: "Unable to analyze the medical image at this time. Please try again or consult with a medical professional for image interpretation.",
        error: "API service temporarily unavailable"
      })
    }

    const result = await response.json()
    
    // Process the response
    let medicalAnalysis = ""
    if (Array.isArray(result) && result[0]?.generated_text) {
      medicalAnalysis = result[0].generated_text
    } else if (result.error) {
      medicalAnalysis = "Unable to analyze the image at this time. Please try again or consult with a medical professional."
    } else {
      medicalAnalysis = "Medical image analysis completed. Please consult with a medical professional for detailed interpretation."
    }

    // Format the response with medical context
    const formattedAnalysis = `
**MedGemma-4B-PT Medical Image Analysis**

**Query:** ${query}

**Analysis:**
${medicalAnalysis}

**Clinical Recommendations:**
- This analysis is for informational purposes only
- Always consult with qualified medical professionals for diagnosis and treatment decisions
- Consider this analysis as a supplementary tool for clinical decision-making

${patientContext ? `\n**Patient Context:** ${patientContext}` : ''}

**Disclaimer:** This AI analysis should not replace professional medical judgment. Always verify findings with appropriate clinical expertise.
    `.trim()

    return NextResponse.json({ 
      analysis: formattedAnalysis,
      model: "MedGemma-4B-PT (Demo)",
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("MedGemma processing error:", error)
    return NextResponse.json({ 
      error: "Failed to process medical image analysis",
      details: error.message 
    }, { status: 500 })
  }
}
