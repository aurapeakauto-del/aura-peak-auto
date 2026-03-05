// proxy.ts في جذر المشروع
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // التحقق من مسارات admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        // استثناء صفحة login
        if (req.nextUrl.pathname === '/admin/login') {
            // إذا كان المستخدم مسجل دخوله بالفعل، حوله للوحة التحكم
            if (session) {
                return NextResponse.redirect(new URL('/admin', req.url))
            }
            return res
        }

        // باقي صفحات admin تحتاج تسجيل دخول
        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }

        // تحقق إذا كان البريد مصرحاً به
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        if (adminEmail && session.user.email !== adminEmail) {
            // سجل خروج المستخدم غير المصرح له
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