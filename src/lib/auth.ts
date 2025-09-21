import { getServerSession } from "next-auth"
import { authOptions } from "./auth-config"
import { UserRole } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!user.role || !allowedRoles.includes(user.role as UserRole)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN])
}

export async function requireAdmin() {
  return requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])
}