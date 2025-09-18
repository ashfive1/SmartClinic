"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
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

      if (data.password_hash !== formData.password) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      localStorage.setItem("auth_email", formData.email)
      alert("Login successful! Redirecting to dashboard...")
      router.push("/dashboard")
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
        .select()

      if (error) throw error

      setSuccess("Sign up successful! Please sign in.")
      setIsSignUp(false)
    } catch (error) {
      setError(error.message || "Sign up failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{isSignUp ? "Create an Account" : "Sign In"}</h1>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="auth-toggle">
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}

