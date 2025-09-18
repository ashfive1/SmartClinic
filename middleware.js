import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient("https://izkqbncayvmoyhtmtooy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a3FibmNheXZtb3lodG10b295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzE1MTgsImV4cCI6MjA3Mzc0NzUxOH0.UkPhWRtKPpmhnilP8pzXfg0_0HfcoREODuNanUhUyJw", {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name, options) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to auth if not authenticated and trying to access protected routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // Redirect to dashboard if authenticated and trying to access auth page
  if (user && request.nextUrl.pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect root to dashboard if authenticated, otherwise to auth
  if (request.nextUrl.pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/auth", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
