import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { cache } from "react"
import { db } from "@/db/client"
import { users, type User } from "@/db/schema"

const syncDbUser = async (clerkUserId: string): Promise<User> => {
  const [user] = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { updatedAt: new Date() },
    })
    .returning()

  if (!user) {
    throw new Error("Failed to sync user profile")
  }

  return user
}

export const ensureDbUser = cache(async (): Promise<User> => {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    throw new Error("UNAUTHORIZED")
  }

  return syncDbUser(clerkUserId)
})

export const getDbUserOrNull = cache(async (): Promise<User | null> => {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return null
  }

  return (
    (await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    })) ?? null
  )
})
