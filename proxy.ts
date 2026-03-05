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
    console.log('📍 Proxy - Session:', !!session)

    // إذا كان المستخدم يحاول الوصول إلى /admin (وليس /admin/login) بدون جلسة
    if (req.nextUrl.pathname === '/admin' && !session) {
        console.log('📍 Proxy - توجيه إلى login')
        return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // إذا كان المستخدم يحاول الوصول إلى /admin/login ولديه جلسة
    if (req.nextUrl.pathname === '/admin/login' && session) {
        console.log('📍 Proxy - توجيه إلى admin')
        return NextResponse.redirect(new URL('/admin', req.url))
    }

    return res
}

export const config = {
    matcher: ['/admin', '/admin/login'], // فقط هذين المسارين
}