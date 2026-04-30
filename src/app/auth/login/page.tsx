"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

const ROLE_OPTIONS = [
  { label: "Staff", value: "1" },
  { label: "Dealer", value: "2" },
  { label: "Admin", value: "3" },
]

const BACKEND_URL = "https://mirisoft.co.in/sas/dealerapi/login/login_verify"

export default function Login() {
  const router = useRouter()

  const [roletype, setRoletype] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !roletype) {
      setError("All fields are required")
      return
    }

    if (!BACKEND_URL) {
      setError("Backend URL is not configured")
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("roletype", roletype)

      const res = await axios.post(
        `${BACKEND_URL}`,
        formData
      )

      const data = res.data

      if (data?.status) {
        const userData = data.data || {
          email,
          role: roletype,
        }

        localStorage.setItem("status", "true")
        localStorage.setItem("UserData", JSON.stringify(userData))
        localStorage.setItem("roletype", roletype)
        if (roletype === "3") {
          localStorage.setItem("AdminData", JSON.stringify(userData))
        }

        setEmail("")
        setPassword("")
        setRoletype("")
        if(roletype === "1"){
          router.push("/dashboard/staff")
        }
        else if(roletype === "2"){
          router.push("/home")
        }
        else if(roletype === "3"){
          router.push("/dashboard/admin")
        }
      } else {
        setError(data?.msg || "Login failed")
      }
    } catch (err: any) {
      console.error("Login error:", err)

      const backendMsg =
        err?.response?.data?.msg ||
        err?.response?.data ||
        err?.message ||
        "Server error"

      setError(typeof backendMsg === "string" ? backendMsg : "Server error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 dark:bg-black text-gray-900 dark:text-white">
      <form className="w-full max-w-sm" onSubmit={handleLogin}>
        <div className="mb-10">
          <h1 className="text-2xl font-light tracking-tight">Sign in</h1>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <select
              value={roletype}
              onChange={(e) => setRoletype(e.target.value)}
              className="w-full px-0 py-3 text-sm bg-transparent border-b border-gray-200 text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white appearance-none"
            >
              <option value="" disabled>
                Role
              </option>
              {ROLE_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="text-gray-900 dark:text-white dark:bg-black"
                >
                  {opt.label}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-0 py-3 text-sm bg-transparent border-b border-gray-200 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-0 py-3 text-sm bg-transparent border-b border-gray-200 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 active:bg-gray-900 transition-all duration-200 disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  )
}