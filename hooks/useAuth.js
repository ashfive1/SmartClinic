"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { USE_MOCK_DATA } from "@/lib/utils"

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = USE_MOCK_DATA ? null : createClient()

  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Provide a mock authenticated user and profile immediately
      const mockUser = { id: "mock-user" }
      const mockProfile = { id: "mock-user", full_name: "Demo User", role: "doctor" }
      setUser(mockUser)
      setProfile(mockProfile)
      setLoading(false)
      return
    }
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    }
  }

  const signOut = async () => {
    if (USE_MOCK_DATA) {
      setUser(null)
      setProfile(null)
      if (typeof window !== "undefined") window.location.replace("/auth")
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
    }
    if (typeof window !== "undefined") window.location.replace("/auth")
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    isDoctor: profile?.role === "doctor",
    isNurse: profile?.role === "nurse",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
