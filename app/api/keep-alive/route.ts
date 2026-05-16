import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ استخدام SERVICE_ROLE_KEY للعمليات الإدارية في الخادم
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ✅ إنشاء عميل بصلاحيات كاملة للخادم فقط
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function GET() {
    try {
        // ✅ التحقق من وجود المفاتيح
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Supabase keys missing');
            return NextResponse.json(
                { success: false, error: 'Configuration error' },
                { status: 500 }
            );
        }

        console.log('🔄 تشغيل مهمة تنشيط قاعدة البيانات...');

        // 1. جلب منتج واحد
        const { error: productsError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (productsError) throw productsError;

        // 2. جلب تصنيف واحد
        const { error: categoriesError } = await supabase
            .from('categories')
            .select('id')
            .limit(1);

        if (categoriesError) throw categoriesError;

        // 3. محاولة جلب طلب واحد (إذا كان الجدول موجوداً)
        try {
            await supabase.from('orders').select('id').limit(1);
        } catch (e) {
            // تجاهل الخطأ إذا كان جدول orders غير موجود
        }

        console.log('✅ تم تنشيط قاعدة البيانات بنجاح');

        return NextResponse.json({
            success: true,
            message: 'تم تنشيط قاعدة البيانات',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ فشل تنشيط قاعدة البيانات:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ✅ دعم طلبات POST أيضاً
export async function POST() {
    return GET();
}