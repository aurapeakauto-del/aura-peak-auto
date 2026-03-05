import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (req.nextUrl.pathname.startsWith('/admin')) {
        if (req.nextUrl.pathname === '/admin/login') {
            if (session) {
                return NextResponse.redirect(new URL('/admin', req.url))
            }
            return res
        }

        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        if (adminEmail && session.user.email !== adminEmail) {
            await supabase.auth.signOut()
            const redirectUrl = new URL('/admin/login', req.url)
            redirectUrl.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(redirectUrl)
        }
    }

    return res
}

export const config = {
    matcher: ['/admin/:path*']
}