import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// تهيئة عميل Supabase مباشرة (للتأكد من عدم وجود مشاكل في الاستيراد)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        console.log('🔄 تشغيل مهمة تنشيط قاعدة البيانات...');
        
        // 1. محاولة جلب منتج واحد فقط (أخف عملية)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (productsError) throw productsError;

        // 2. محاولة جلب تصنيف واحد
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id')
            .limit(1);

        if (categoriesError) throw categoriesError;

        // 3. محاولة جلب طلب واحد (إذا كان الجدول موجود)
        try {
            await supabase
                .from('orders')
                .select('id')
                .limit(1);
        } catch (e) {
            // تجاهل الخطأ إذا كان جدول orders غير موجود
            console.log('⚠️ جدول orders غير موجود (طبيعي إذا ما في طلبات)');
        }

        // 4. محاولة جلب تقييم واحد
        try {
            await supabase
                .from('ratings')
                .select('id')
                .limit(1);
        } catch (e) {
            // تجاهل الخطأ
        }

        console.log('✅ تم تنشيط قاعدة البيانات بنجاح');

        return NextResponse.json({
            success: true,
            message: 'تم تنشيط قاعدة البيانات',
            timestamp: new Date().toISOString(),
            stats: {
                products: products?.length || 0,
                categories: categories?.length || 0
            }
        });

    } catch (error: any) {
        console.error('❌ فشل تنشيط قاعدة البيانات:', error.message);
        
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// لدعم طلبات POST أيضاً (بعض خدمات cron تستخدم POST)
export async function POST() {
    return GET();
}