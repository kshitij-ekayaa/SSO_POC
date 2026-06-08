import { NextResponse } from 'next/server'
import { auth } from '@/auth'

async function getAdminToken() {
  const response = await fetch('http://localhost:8090/realms/master/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: 'Kshitij',
      password: 'Kshitij@Keycloak12',
    }),
  })
  const data = await response.json()
  return data.access_token
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId, roleName } = await request.json()
    const token = await getAdminToken()

    // Get all realm roles
    const rolesRes = await fetch('http://localhost:8090/admin/realms/myrealm/roles', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const allRoles = await rolesRes.json()

    // Find the new role to assign
    const newRole = allRoles.find((r: any) => r.name === roleName)
    if (!newRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Get user's current roles
    const currentRolesRes = await fetch(
      `http://localhost:8090/admin/realms/myrealm/users/${userId}/role-mappings/realm`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const currentRoles = await currentRolesRes.json()

    // Remove old custom roles (Admin, Project Lead, Member, Viewer)
    const customRoles = ['Admin', 'Project Lead', 'Member', 'Viewer']
    const rolesToRemove = currentRoles.filter((r: any) => customRoles.includes(r.name))

    if (rolesToRemove.length > 0) {
      await fetch(`http://localhost:8090/admin/realms/myrealm/users/${userId}/role-mappings/realm`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rolesToRemove),
      })
    }

    // Assign new role
    const assignRes = await fetch(`http://localhost:8090/admin/realms/myrealm/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([newRole]),
    })

    if (assignRes.status === 204 || assignRes.status === 200) {
      return NextResponse.json({ success: true, message: `Role ${roleName} assigned successfully!` })
    } else {
      const errorText = await assignRes.text()
      return NextResponse.json({ error: errorText }, { status: assignRes.status })
    }
  } catch (error) {
    console.error("Error assigning role:", error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}