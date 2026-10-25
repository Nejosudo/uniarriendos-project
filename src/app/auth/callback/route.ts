import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSiteUrl, safeRedirectPath } from '@/lib/siteUrl'

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const safeNext = safeRedirectPath(searchParams.get('next'))
    const base = getSiteUrl()

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) return NextResponse.redirect(`${base}${safeNext}`)
    }

    const token_hash = searchParams.get('token_hash')
    const typeRaw = searchParams.get('type')
    const type = OTP_TYPES.find((value) => value === typeRaw)

    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) return NextResponse.redirect(`${base}${safeNext}`)
    }

    return NextResponse.redirect(`${base}/login?error=auth_callback`)
}
