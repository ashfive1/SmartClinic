"use client"

import ChatUI from "@/components/ChatUI"

export default function ChatbotPage() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">AI Medical Assistant</h1>
        <p className="dashboard-subtitle">Search patients and get AI-powered care recommendations with Google Gemma 3N E4B IT</p>
        <div style={{ 
          background: "var(--muted)", 
          padding: "1rem", 
          borderRadius: "8px", 
          marginTop: "1rem",
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>🆓 Google Gemma 3N E4B IT Medical AI</h3>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Powered by <strong>Google Gemma 3N E4B IT</strong> (free via OpenRouter) for clinical-grade medical AI. 
            Upload medical images or ask questions for professional medical insights and recommendations.
            <br />
            <em>Fallback: Free Llama 3.1 8B + BLIP models available</em>
          </p>
        </div>
      </div>

      <ChatUI />
    </div>
  )
}
