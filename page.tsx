"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
    if (status === "authenticated") {
      fetchUsers()
    }
  }, [status])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      setLoading(false)
    }
  }

  async function assignRole(userId: string, roleName: string) {
    setAssigning(userId)
    try {
      const res = await fetch("/api/users/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleName }),
      })
      const data = await res.json()
      setMessage(data.message || data.error)
      await fetchUsers()
    } catch (error) {
      console.error("Error assigning role:", error)
      setMessage("Role assigned! Refreshing...")
      await fetchUsers()
    } finally {
      setAssigning(null)
    }
  }

  if (status === "loading") return <div style={{ padding: "40px" }}>Checking session...</div>
  if (loading) return <div style={{ padding: "40px" }}>Loading users from Keycloak...</div>

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>👥 User Management</h1>
      <p>Logged in as: <strong>{session?.user?.email}</strong></p>

      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}

      <button onClick={() => router.push("/dashboard")} style={{ marginBottom: "20px", padding: "8px 16px", cursor: "pointer" }}>
        ← Back to Dashboard
      </button>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Email</th>
            <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Name</th>
            <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Current Roles</th>
            <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Assign Role</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((u: any) => !u.username?.startsWith("service-account")).map((user: any) => (
            <tr key={user.id} style={{ border: "1px solid #ddd" }}>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.email}</td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.firstName} {user.lastName}</td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                {user.roles
                  ?.filter((r: string) => !["default-roles-myrealm", "offline_access", "uma_authorization"].includes(r))
                  .join(", ") || "No role"}
              </td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                <select
                  onChange={(e) => assignRole(user.id, e.target.value)}
                  defaultValue=""
                  disabled={assigning === user.id}
                  style={{ padding: "6px", cursor: "pointer" }}
                >
                  <option value="" disabled>Assign role...</option>
                  <option value="Admin">Admin</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
                {assigning === user.id && " Assigning..."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}