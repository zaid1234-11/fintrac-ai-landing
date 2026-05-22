import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/invest(.*)',
  '/api/secure(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // If the user is trying to access a protected route and is not logged in,
  // this will redirect them to the Clerk Sign In page.
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path and API routes
    '/(api|trpc)(.*)',
  ],
}
