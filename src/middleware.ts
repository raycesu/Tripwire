import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/assets(.*)",
  "/alerts(.*)",
  "/settings(.*)",
])

const isProtectedApiRoute = createRouteMatcher([
  "/api/watchlist(.*)",
  "/api/alerts(.*)",
  "/api/telegram/connect",
  "/api/telegram/test",
  "/api/assets(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) || isProtectedApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
