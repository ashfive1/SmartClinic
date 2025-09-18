# 🏥 SmartClinic – The AI-Powered Clinical Copilot

SmartClinic is a **Next.js + Supabase** project that empowers doctors and clinicians with **AI-driven decision support**. It transforms scattered patient data into **actionable, evidence-based insights**—all within a clean, responsive dashboard.

---

## 🚀 Features
- 🔐 **User Authentication & Onboarding** (Supabase Auth + custom roles for doctors, nurses, admins)  
- 🤖 **AI Clinical Agent**: Summarizes patient records & suggests 3 evidence-based care options with citations  
- 📊 **Real-Time Dashboard**: Patient data visualization, lifestyle risks, and health metrics  
- 📱 **Mobile-Responsive UI/UX** with smooth animations and accessibility compliance (WCAG)  
- 🔗 **API Integrations**: Medical literature sources (e.g., PubMed API) + EHR/FHIR-compatible data parsing  
- 🗄 **Supabase Database**: Secure storage for patients, accounts, and health metrics  

---

## 🛠️ Tech Stack
- **Frontend**: [Next.js](https://nextjs.org/) + React  
- **Backend/Database**: [Supabase](https://supabase.com/) (Auth, Postgres, Realtime)  
- **AI/ML**: OpenRouter + MedGemma integration for medical LLMs  
- **Styling**: TailwindCSS, modern animations (Framer Motion / React Bits)  
- **Deployment**: Vercel + Supabase hosting  

---

## ⚙️ Setup
1. Clone the repo:
   ```bash
   git clone https://github.com/ashfive1/SmartClinic.git
   cd SmartClinic
2. Install dependencies:
   ```bash
   npm install
3. Create a .env.local file with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENROUTER_API_KEY=your-openrouter-key
5. Run the dev server
   ```bash
   npm run dev

## 📂 Database Schema
Includes tables for:
patients: demographics, health risks, lifestyle factors
accounts: doctors, nurses, admins (with roles, gender, dob, specialization)
metrics: vitals and medical history

See supabase-schema.sql
 for full schema.

## 🎯 Value Proposition
Saves clinicians hours of manual data sifting.
Provides trustworthy, evidence-backed suggestions at the point of care.
Bridges AI with real-world healthcare accessibility, scalable to hospitals worldwide.

## 🧑‍⚕️ Target Users
Doctors & nurses needing fast, accurate decision support
Clinics managing large patient databases
Healthcare startups aiming to integrate AI copilots into EHR systems

