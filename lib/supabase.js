import { createBrowserClient, createServerClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    "https://izkqbncayvmoyhtmtooy.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a3FibmNheXZtb3lodG10b295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzE1MTgsImV4cCI6MjA3Mzc0NzUxOH0.UkPhWRtKPpmhnilP8pzXfg0_0HfcoREODuNanUhUyJw"
  )
}

export function createServerSupabaseClient(cookieStore) {
  return createServerClient(
    "https://izkqbncayvmoyhtmtooy.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a3FibmNheXZtb3lodG10b295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzE1MTgsImV4cCI6MjA3Mzc0NzUxOH0.UkPhWRtKPpmhnilP8pzXfg0_0HfcoREODuNanUhUyJw",
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}
