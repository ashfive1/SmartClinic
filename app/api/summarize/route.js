import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { patient } = await request.json()

    if (!patient) {
      return NextResponse.json({ error: "Patient data is required" }, { status: 400 })
    }

    // Get the latest patient record
    const latestRecord = patient.patient_records?.[0]
    if (!latestRecord) {
      return NextResponse.json({ recommendations: [] })
    }

    // Generate AI-powered recommendations based on patient data
    const recommendations = await generateMedicalRecommendations(patient, latestRecord)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Summarize API error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

async function generateMedicalRecommendations(patient, record) {
  // This is a simplified AI recommendation system
  // In production, you would integrate with a proper medical AI service
  const recommendations = []

  // Risk-based assessment
  const riskScore = calculateRiskScore(record)

  // Critical conditions
  if (record.risk_level === "critical" || riskScore >= 8) {
    recommendations.push({
      title: "Emergency Protocol Activation",
      priority: "high",
      description:
        "Patient presents with critical risk factors requiring immediate medical intervention. Activate emergency protocols and consider ICU admission.",
      evidence: [
        `Risk level: ${record.risk_level}`,
        `Calculated risk score: ${riskScore}/10`,
        `Chief complaint: ${record.chief_complaint}`,
        "Requires continuous monitoring and immediate physician evaluation",
      ],
    })
  }

  // Cardiovascular assessment
  if (record.systolic_bp > 180 || record.diastolic_bp > 110) {
    recommendations.push({
      title: "Hypertensive Crisis Management",
      priority: "high",
      description:
        "Severe hypertension detected. Immediate blood pressure management required to prevent end-organ damage.",
      evidence: [
        `Blood pressure: ${record.systolic_bp}/${record.diastolic_bp} mmHg`,
        "Exceeds hypertensive crisis threshold (180/110)",
        "Risk of stroke, heart attack, or kidney damage",
        "Consider IV antihypertensive therapy",
      ],
    })
  } else if (record.systolic_bp > 140 || record.diastolic_bp > 90) {
    recommendations.push({
      title: "Hypertension Management",
      priority: "medium",
      description:
        "Elevated blood pressure requires management. Consider lifestyle modifications and antihypertensive therapy.",
      evidence: [
        `Blood pressure: ${record.systolic_bp}/${record.diastolic_bp} mmHg`,
        "Above normal range (120/80 mmHg)",
        "Increased cardiovascular risk",
        "Lifestyle counseling and medication review indicated",
      ],
    })
  }

  // Respiratory assessment
  if (record.oxygen_saturation < 90) {
    recommendations.push({
      title: "Severe Hypoxemia Management",
      priority: "high",
      description:
        "Critically low oxygen saturation requires immediate respiratory support and evaluation for underlying causes.",
      evidence: [
        `Oxygen saturation: ${record.oxygen_saturation}%`,
        "Below critical threshold (90%)",
        "Risk of organ dysfunction",
        "Consider high-flow oxygen, CPAP, or mechanical ventilation",
      ],
    })
  } else if (record.oxygen_saturation < 95) {
    recommendations.push({
      title: "Oxygen Therapy Consideration",
      priority: "medium",
      description: "Low oxygen saturation may require supplemental oxygen and respiratory assessment.",
      evidence: [
        `Oxygen saturation: ${record.oxygen_saturation}%`,
        "Below normal range (95-100%)",
        "Assess for respiratory compromise",
        "Consider chest imaging and arterial blood gas analysis",
      ],
    })
  }

  // Pain management
  if (record.pain_scale >= 8) {
    recommendations.push({
      title: "Severe Pain Management",
      priority: "high",
      description:
        "Severe pain requires immediate attention and comprehensive pain management strategy with regular reassessment.",
      evidence: [
        `Pain scale: ${record.pain_scale}/10`,
        "Severe pain level affecting quality of life",
        "Consider multimodal pain management approach",
        "Regular pain reassessment every 2-4 hours",
      ],
    })
  } else if (record.pain_scale >= 5) {
    recommendations.push({
      title: "Moderate Pain Management",
      priority: "medium",
      description: "Moderate pain requires appropriate analgesic therapy and monitoring for effectiveness.",
      evidence: [
        `Pain scale: ${record.pain_scale}/10`,
        "Moderate pain level",
        "Consider non-opioid analgesics first",
        "Monitor for pain relief and side effects",
      ],
    })
  }

  // Temperature assessment
  if (record.temperature > 103) {
    recommendations.push({
      title: "High Fever Management",
      priority: "high",
      description: "High fever requires immediate cooling measures and investigation for underlying infection.",
      evidence: [
        `Temperature: ${record.temperature}°F`,
        "High fever (>103°F)",
        "Risk of febrile complications",
        "Consider blood cultures and broad-spectrum antibiotics",
      ],
    })
  } else if (record.temperature > 100.4) {
    recommendations.push({
      title: "Fever Evaluation",
      priority: "medium",
      description: "Fever present. Investigate source and consider antipyretic therapy.",
      evidence: [
        `Temperature: ${record.temperature}°F`,
        "Fever threshold exceeded (>100.4°F)",
        "Assess for signs of infection",
        "Consider diagnostic workup based on clinical presentation",
      ],
    })
  }

  // Consciousness level assessment
  if (record.consciousness_level === "unresponsive") {
    recommendations.push({
      title: "Altered Mental Status - Critical",
      priority: "high",
      description:
        "Unresponsive patient requires immediate neurological assessment and airway protection. Consider multiple etiologies.",
      evidence: [
        "Consciousness level: Unresponsive",
        "Risk of airway compromise",
        "Requires immediate physician evaluation",
        "Consider CT head, glucose check, toxicology screen",
      ],
    })
  } else if (record.consciousness_level === "pain") {
    recommendations.push({
      title: "Altered Mental Status Evaluation",
      priority: "medium",
      description: "Decreased consciousness requires neurological assessment and investigation of underlying causes.",
      evidence: [
        "Consciousness level: Responds to pain only",
        "Altered mental status",
        "Assess for metabolic, toxic, or structural causes",
        "Consider neurological consultation",
      ],
    })
  }

  // Limit to top 3 most relevant recommendations
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 3)
}

function calculateRiskScore(record) {
  let score = 0

  // Vital signs scoring
  if (record.systolic_bp > 180 || record.diastolic_bp > 110) score += 3
  else if (record.systolic_bp > 140 || record.diastolic_bp > 90) score += 1

  if (record.heart_rate > 120 || record.heart_rate < 50) score += 2
  else if (record.heart_rate > 100 || record.heart_rate < 60) score += 1

  if (record.oxygen_saturation < 90) score += 3
  else if (record.oxygen_saturation < 95) score += 1

  if (record.temperature > 103 || record.temperature < 95) score += 2
  else if (record.temperature > 100.4) score += 1

  if (record.respiratory_rate > 30 || record.respiratory_rate < 10) score += 2
  else if (record.respiratory_rate > 24 || record.respiratory_rate < 12) score += 1

  // Consciousness level scoring
  if (record.consciousness_level === "unresponsive") score += 3
  else if (record.consciousness_level === "pain") score += 2
  else if (record.consciousness_level === "verbal") score += 1

  // Pain scale scoring
  if (record.pain_scale >= 8) score += 2
  else if (record.pain_scale >= 5) score += 1

  // Risk level scoring
  if (record.risk_level === "critical") score += 3
  else if (record.risk_level === "high") score += 2
  else if (record.risk_level === "medium") score += 1

  return Math.min(score, 10) // Cap at 10
}
