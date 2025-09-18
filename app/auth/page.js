"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import "../globals.css"
import "./styles.css"


export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "nurse",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Fetch account by email only
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", formData.email)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Compare password in JS
      if (data.password_hash !== formData.password) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Success: redirect
      localStorage.setItem("auth_email", formData.email);
      alert("Login successful! Redirecting to dashboard...");
      console.log("Redirecting to /dashboard")
      router.push("/dashboard")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 100)
    } catch (error) {
      setError(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Store password as plain string in password_hash
      const { data, error } = await supabase
        .from("accounts")
        .insert([
          {
            email: formData.email,
            password_hash: formData.password,
            full_name: formData.fullName,
            role: formData.role,
            is_active: true,
          },
        ])
        .single()

      if (error) throw error

      setSuccess("Account created successfully! You can now sign in.")
      setIsSignUp(false)
    } catch (error) {
      // If you see a row-level security error, check your Supabase RLS policies for the 'accounts' table.
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <form className="form" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <p id="heading">{isSignUp ? "Create account" : "Sign in"}</p>

        {isSignUp && (
          <div className="field">
            <svg className="input-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM2 13s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H2Zm1-1h10c-.2-.6-1.6-2-5-2s-4.8 1.4-5 2Z"/></svg>
            <input className="input-field" type="text" placeholder="Full name" name="fullName" value={formData.fullName} onChange={handleInputChange} required={isSignUp} />
          </div>
        )}

        <div className="field">
          <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z"/></svg>
          <input className="input-field" type="email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} required />
        </div>

        <div className="field">
          <svg className="input-icon" viewBox="0 0 24 24"><path d="M17 8V7a5 5 0 0 0-10 0v1H5v14h14V8h-2Zm-8 0V7a3 3 0 1 1 6 0v1H9Zm10 12H5V10h14v10Z"/></svg>
          <input className="input-field" type="password" placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6} />
        </div>

        {isSignUp && (
          <div className="field">
            <svg className="input-icon" viewBox="0 0 24 24"><path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h16v4H4z"/></svg>
            <select className="input-field" name="role" value={formData.role} onChange={handleInputChange}>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="btn">
          <button className="button1" type="button" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
          <button className="button2" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : isSignUp ? "Create" : "Login"}
          </button>
        </div>
        <button className="button3" type="button" onClick={() => router.push("/")}>Back</button>
      </form>
    </div>
  )
}

