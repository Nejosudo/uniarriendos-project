import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/explorar'

    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/explorar'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
    }
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as any
    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
