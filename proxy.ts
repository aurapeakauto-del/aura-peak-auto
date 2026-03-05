import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    const res = NextResponse.next()
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    res.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    console.log('📍 Proxy - Path:', req.nextUrl.pathname)
    console.log('📍 Proxy - Session exists:', !!session)

    // إذا كان المستخدم يحاول الوصول إلى /admin بدون جلسة
    if (req.nextUrl.pathname.startsWith('/admin') && !session) {
        console.log('📍 Proxy - لا توجد جلسة، توجيه إلى login')
        if (!req.nextUrl.pathname.startsWith('/admin/login')) {
            const redirectUrl = new URL('/admin/login', req.url)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // ✅ الأهم: إذا كان المستخدم يحاول الوصول إلى /admin/login ولديه جلسة
    if (req.nextUrl.pathname.startsWith('/admin/login') && session) {
        console.log('📍 Proxy - توجد جلسة، توجيه إلى admin')
        const redirectUrl = new URL('/admin', req.url)
        return NextResponse.redirect(redirectUrl)
    }

    return res
}

export const config = {
    matcher: '/admin/:path*',
}