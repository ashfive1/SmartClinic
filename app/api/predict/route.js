import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { patientData } = await request.json()

    if (!patientData) {
      return NextResponse.json({ error: "Patient data is required" }, { status: 400 })
    }

    // Simple ML-like risk prediction based on vital signs and symptoms
    const riskScore = calculateRiskPrediction(patientData)

    return NextResponse.json({
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      factors: getContributingFactors(patientData),
      recommendations: getRiskBasedRecommendations(riskScore),
    })
  } catch (error) {
    console.error("Predict API error:", error)
    return NextResponse.json({ error: "Failed to generate risk prediction" }, { status: 500 })
  }
}

function calculateRiskPrediction(data) {
  let score = 0

  // Vital signs scoring (0-40 points)
  if (data.systolic_bp > 180 || data.diastolic_bp > 110) score += 10
  else if (data.systolic_bp > 140 || data.diastolic_bp > 90) score += 5

  if (data.heart_rate > 120 || data.heart_rate < 50) score += 8
  else if (data.heart_rate > 100 || data.heart_rate < 60) score += 3

  if (data.oxygen_saturation < 90) score += 10
  else if (data.oxygen_saturation < 95) score += 5

  if (data.temperature > 103 || data.temperature < 95) score += 8
  else if (data.temperature > 100.4) score += 3

  if (data.respiratory_rate > 30 || data.respiratory_rate < 10) score += 6
  else if (data.respiratory_rate > 24 || data.respiratory_rate < 12) score += 2

  // Consciousness level scoring (0-15 points)
  if (data.consciousness_level === "unresponsive") score += 15
  else if (data.consciousness_level === "pain") score += 10
  else if (data.consciousness_level === "verbal") score += 5

  // Pain scale scoring (0-10 points)
  if (data.pain_scale >= 8) score += 8
  else if (data.pain_scale >= 5) score += 4
  else if (data.pain_scale >= 3) score += 2

  // Symptom-based scoring (0-20 points)
  const highRiskSymptoms = ["chest pain", "difficulty breathing", "severe pain", "unconscious", "bleeding"]
  const symptoms = (data.symptoms || "").toLowerCase()
  const complaint = (data.chief_complaint || "").toLowerCase()

  highRiskSymptoms.forEach((symptom) => {
    if (symptoms.includes(symptom) || complaint.includes(symptom)) {
      score += 4
    }
  })

  // Age factor (if date of birth provided)
  if (data.date_of_birth) {
    const age = new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()
    if (age > 75) score += 5
    else if (age > 65) score += 3
    else if (age < 2) score += 4
  }

  // Medical history factor (0-10 points)
  const highRiskConditions = ["diabetes", "heart disease", "copd", "cancer", "kidney disease"]
  const history = (data.medical_history || "").toLowerCase()

  highRiskConditions.forEach((condition) => {
    if (history.includes(condition)) {
      score += 2
    }
  })

  return Math.min(score, 100) // Cap at 100
}

function getRiskLevel(score) {
  if (score >= 70) return "critical"
  if (score >= 50) return "high"
  if (score >= 30) return "medium"
  return "low"
}

function getContributingFactors(data) {
  const factors = []

  if (data.systolic_bp > 140 || data.diastolic_bp > 90) {
    factors.push("Elevated blood pressure")
  }
  if (data.heart_rate > 100 || data.heart_rate < 60) {
    factors.push("Abnormal heart rate")
  }
  if (data.oxygen_saturation < 95) {
    factors.push("Low oxygen saturation")
  }
  if (data.temperature > 100.4) {
    factors.push("Fever present")
  }
  if (data.pain_scale >= 7) {
    factors.push("Severe pain")
  }
  if (data.consciousness_level !== "alert") {
    factors.push("Altered consciousness")
  }

  return factors
}

function getRiskBasedRecommendations(score) {
  if (score >= 70) {
    return [
      "Immediate medical attention required",
      "Consider ICU admission",
      "Continuous monitoring needed",
      "Activate emergency protocols",
    ]
  }
  if (score >= 50) {
    return [
      "Urgent medical evaluation needed",
      "Frequent vital sign monitoring",
      "Consider hospital admission",
      "Physician consultation required",
    ]
  }
  if (score >= 30) {
    return [
      "Medical evaluation recommended",
      "Monitor vital signs regularly",
      "Follow-up within 24 hours",
      "Consider diagnostic testing",
    ]
  }
  return [
    "Routine monitoring appropriate",
    "Standard care protocols",
    "Schedule follow-up as needed",
    "Patient education and discharge planning",
  ]
}
