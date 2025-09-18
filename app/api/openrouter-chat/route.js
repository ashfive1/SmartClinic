import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request) {
  try {
    const { messages, patient } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not set on server" }, { status: 500 });
    }

    // Only include medical_history in the system prompt if present
    let chatMessages = messages;
    if (patient?.medical_history) {
      const historyPrompt = `Patient medical history: ${patient.medical_history}`;
      chatMessages = messages.filter(m => m.role !== "system");
      chatMessages.unshift({ role: "system", content: historyPrompt });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-2-9b-it:free",
        messages: chatMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const aiContent = response?.data?.choices?.[0]?.message?.content;
    if (!aiContent) {
      return NextResponse.json({ error: "No response from model" }, { status: 502 });
    }
    return NextResponse.json({ content: aiContent });
  } catch (error) {
    let errorMsg = "Failed to get response from OpenRouter";
    if (error?.response?.data) {
      errorMsg = JSON.stringify(error.response.data);
    } else if (error?.message) {
      errorMsg = error.message;
    }
    console.error("OpenRouter chat error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
