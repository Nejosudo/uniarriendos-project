/** URL base del sitio para redirects de Supabase Auth (confirmación y recuperación). */
export function getSiteUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '')
    }
    return 'http://localhost:3000'
}

export function authCallbackUrl(nextPath: string): string {
    const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
    return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
}
