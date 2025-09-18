"use client"

import ChatUI from "@/components/ChatUI"

export default function ChatbotPage() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">AI Medical Assistant</h1>
        <p className="dashboard-subtitle">Search patients and get AI-powered care recommendations</p>
      </div>

      <ChatUI />
    </div>
  )
}
