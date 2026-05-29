export const extractCronSecret = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim()

    if (token) {
      return token
    }
  }

  const url = new URL(request.url)
  const querySecret = url.searchParams.get("secret")

  if (querySecret) {
    return querySecret
  }

  return null
}
