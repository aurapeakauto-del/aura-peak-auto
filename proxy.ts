// proxy.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createServerClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // ... باقي الكود كما هو ...
    // (كل الكود من السطر 10 إلى 34 يبقى كما هو دون تغيير)

    return res
}

export const config = {
    matcher: ['/admin/:path*']
}