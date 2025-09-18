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
      // Always forget session on reload in mock mode
      setUser(null)
      setProfile(null)
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

  // Fetch profile from accounts table by email (from localStorage)
  const fetchProfile = async (email) => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setProfile({
        id: data.account_id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    }
  }

  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Always forget session on reload in mock mode
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    // Get initial profile from localStorage (set by login)
    const email = typeof window !== "undefined" ? localStorage.getItem("auth_email") : null;
    if (email) {
      fetchProfile(email);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [])

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
