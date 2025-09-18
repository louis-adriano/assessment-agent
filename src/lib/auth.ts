import { auth } from "next-auth"
import { Role } from "@prisma/client"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  if (!user.role || !allowedRoles.includes(user.role as Role)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function requireSuperAdmin() {
  return requireRole([Role.SUPER_ADMIN])
}

export async function requireAdmin() {
  return requireRole([Role.SUPER_ADMIN, Role.COURSE_ADMIN])
}