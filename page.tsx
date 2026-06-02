import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "20px" }}>
      <h1>Login Successful! ✅</h1>
      <p>Welcome, {session.user?.name}!</p>
      <p>Email: {session.user?.email}</p>
      <form action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}>
        <button type="submit" style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "red", color: "white", border: "none", borderRadius: "8px" }}>
          Logout
        </button>
      </form>
    </div>
  )
}