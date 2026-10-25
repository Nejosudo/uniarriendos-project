const PRODUCTION_FALLBACK = 'https://uniarriendos-project.vercel.app';
const DEVELOPMENT_FALLBACK = 'http://localhost:3000';

function parseHttpUrl(value: string): URL | null {
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url;
    } catch {
        return null;
    }
}

function isLocalHost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

/** URL pública del sitio, válida para metadata, sitemap, emails y Auth. */
export function getSiteUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const parsed = fromEnv ? parseHttpUrl(fromEnv) : null;
    const isProduction = process.env.NODE_ENV === 'production';

    if (parsed && (!isProduction || !isLocalHost(parsed.hostname))) {
        return parsed.origin;
    }

    const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
        const normalized = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return `https://${normalized}`;
    }

    return isProduction ? PRODUCTION_FALLBACK : DEVELOPMENT_FALLBACK;
}

export function authCallbackUrl(nextPath: string): string {
    const next = nextPath.startsWith('/') && !nextPath.startsWith('//')
        ? nextPath
        : '/explorar';
    return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function safeRedirectPath(value: string | null): string {
    if (!value) return '/explorar';

    try {
        const base = new URL(getSiteUrl());
        const target = new URL(value, base);
        if (target.origin !== base.origin) return '/explorar';
        return `${target.pathname}${target.search}${target.hash}`;
    } catch {
        return '/explorar';
    }
}
