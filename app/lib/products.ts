import { supabase } from './supabase'

// ============ تعريف أنواع المتغيرات ============
export interface VariantOption {
    name: string;           // اسم الخيار (أحمر، أزرق، كبير، صغير)
    stock: number;          // الكمية المتوفرة لهذا الخيار
    extraPrice: number;     // السعر الإضافي (0 إذا نفس السعر الأساسي)
}

export interface Variant {
    id: string;             // معرف فريد (مؤقت)
    name: string;           // اسم المتغير (اللون، المقاس، المادة)
    options: VariantOption[];
}

// ============ تعريف نظام توافق المركبات ============
export interface VehicleFitment {
    id: string;
    make: string;           // الماركة (BMW, Mercedes, Toyota)
    model: string;          // الموديل (X5, GLE, Camry)
    year: number;           // السنة (2020, 2021)
    stock: number;          // الكمية المتوفرة لهذا التوافق
    extraPrice: number;     // سعر إضافي (اختياري)
    image?: string;         // صورة اختيارية للتوافق
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    cost_price?: number;
    image: string;
    images: string[];
    categories: string[];
    discount?: number;
    discount_end_date?: string | null;
    freeShipping?: boolean;
    free_shipping_end_date?: string | null;
    offer?: boolean;
    featured?: boolean;
    recommended?: boolean;
    stock: number;
    variants: Variant[];
    vehicleFitments: VehicleFitment[];  // ✅ جديد
    relatedProducts?: number[];
}

// ✅ حساب إجمالي الكمية من المتغيرات
export function getTotalStockFromVariants(variants: Variant[]): number {
    return variants.reduce((total, variant) => {
        return total + variant.options.reduce((sum, opt) => sum + opt.stock, 0);
    }, 0);
}

// ✅ حساب إجمالي الكمية من توافق المركبات
export function getTotalStockFromVehicleFitments(fitments: VehicleFitment[]): number {
    return fitments.reduce((total, f) => total + f.stock, 0);
}

async function notifyN8N(product: Product) {
    try {
        const webhookUrl = process.env.N8N_PRODUCT_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('⚠️ N8N_PRODUCT_WEBHOOK_URL غير مضبوط');
            return;
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aura-peak-auto.vercel.app';

        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: 'new_product',
                product: {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.categories?.[0] || '',
                    stock: product.stock,
                    image_url: product.image,
                    url: `${siteUrl}/products/${product.id}`
                }
            })
        });
        console.log(`✅ تم إرسال الإشعار إلى n8n للمنتج: ${product.name}`);
    } catch (error) {
        console.error('❌ فشل إرسال الإشعار إلى n8n:', error);
    }
}

// ✅ تحويل البيانات من Supabase إلى شكل Product
const mapSupabaseProduct = (data: any): Product => {
    // تحويل المتغيرات من JSONB إلى مصفوفة Variant
    let variants: Variant[] = [];
    if (data.variants && Array.isArray(data.variants)) {
        variants = data.variants.map((v: any) => ({
            id: v.id || Date.now().toString(),
            name: v.name,
            options: (v.options || []).map((opt: any) => ({
                name: opt.name,
                stock: opt.stock || 0,
                extraPrice: opt.extraPrice || 0
            }))
        }));
    }

    // تحويل توافق المركبات من JSONB
    let vehicleFitments: VehicleFitment[] = [];
    if (data.vehicle_fitments && Array.isArray(data.vehicle_fitments)) {
        vehicleFitments = data.vehicle_fitments.map((vf: any) => ({
            id: vf.id || Date.now().toString(),
            make: vf.make,
            model: vf.model,
            year: vf.year,
            stock: vf.stock || 0,
            extraPrice: vf.extraPrice || 0,
            image: vf.image || ''
        }));
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: data.price,
        cost_price: data.cost_price,
        image: data.image || '/images/placeholder.jpg',
        images: data.images || [],
        categories: data.categories || [],
        discount: data.discount || 0,
        discount_end_date: data.discount_end_date || null,
        freeShipping: data.free_shipping || false,
        free_shipping_end_date: data.free_shipping_end_date || null,
        offer: data.offer || false,
        featured: data.featured || false,
        recommended: data.recommended || false,
        stock: data.stock || 0,
        variants: variants,
        vehicleFitments: vehicleFitments,
        relatedProducts: data.related_products || []
    };
}

// ✅ تحويل Product إلى شكل Supabase
const toSupabaseProduct = (product: Partial<Product>) => {
    // ✅ اقرأ من snake_case إذا كان موجوداً، وإلا من camelCase
    const vehicleFitmentsData = (product as any).vehicle_fitments || product.vehicleFitments || [];

    const result = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        image: product.image,
        images: product.images || [],
        categories: product.categories || [],
        discount: product.discount || 0,
        discount_end_date: product.discount_end_date || null,
        free_shipping: product.freeShipping || false,
        free_shipping_end_date: product.free_shipping_end_date || null,
        offer: product.offer || false,
        featured: product.featured || false,
        recommended: product.recommended || false,
        stock: product.stock || 0,
        variants: product.variants || [],
        vehicle_fitments: vehicleFitmentsData,
        related_products: product.relatedProducts || []
    };

    console.log('🔴 [3] vehicle_fitments في supabaseData:', JSON.stringify(result.vehicle_fitments, null, 2));
    console.log('🔴 [3] عدد التوافقات:', result.vehicle_fitments.length);

    return result;
};
// ============ دوال القراءة من Supabase ============

export async function getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })

    if (error) {
        console.error('خطأ في جلب المنتجات:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

export async function getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('خطأ في جلب المنتج:', error)
        return null
    }

    return mapSupabaseProduct(data)
}

export async function getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(8)

    if (error) {
        console.error('خطأ في جلب المنتجات المميزة:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

export async function getRecommendedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('recommended', true)
        .limit(8)

    if (error) {
        console.error('خطأ في جلب المنتجات الموصى بها:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

export async function getOfferProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('offer', true)
        .limit(8)

    if (error) {
        console.error('خطأ في جلب منتجات العروض:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .contains('categories', [category])

    if (error) {
        console.error('خطأ في جلب المنتجات حسب التصنيف:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

// ============ دوال الإدارة (Admin) ============

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    // ✅ مصحح [2.5] - استلام البيانات
    console.log('🔴 [2.5] addProduct received:', {
        name: product.name,
        vehicleFitmentsCount: (product as any).vehicle_fitments?.length || 0,
        vehicleFitments: (product as any).vehicle_fitments,
        variantsCount: product.variants?.length || 0
    });

    // الحصول على أقصى ID + 1
    const { data: maxIdData } = await supabase
        .from('products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)

    const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1

    const supabaseProduct = toSupabaseProduct({
        ...product,
        id: newId
    })

    // ✅ مصحح [4] - قبل الإرسال إلى Supabase
    console.log('🔴 [4] supabaseProduct قبل الإرسال:', JSON.stringify({
        id: supabaseProduct.id,
        name: supabaseProduct.name,
        vehicle_fitments_count: supabaseProduct.vehicle_fitments?.length || 0,
        vehicle_fitments: supabaseProduct.vehicle_fitments
    }, null, 2));

    const { data, error } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select()
        .single()

    // ✅ مصحح [5] - بعد الإرسال (في حالة الخطأ)
    if (error) {
        console.error('🔴 [5] خطأ في إضافة المنتج:', error);
        console.error('🔴 [5] تفاصيل الخطأ:', error.message, error.details, error.hint);
        return null
    }

    // ✅ مصحح [6] - بعد النجاح
    console.log('🔴 [6] تم إضافة المنتج بنجاح، vehicle_fitments:', data?.vehicle_fitments);
    console.log('🔴 [6] البيانات الكاملة:', data);

    const newProduct = mapSupabaseProduct(data)
    await notifyN8N(newProduct);
    return newProduct
}
export async function updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    const supabaseUpdates = toSupabaseProduct(updates)

    const { data, error } = await supabase
        .from('products')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('خطأ في تحديث المنتج:', error)
        return null
    }

    return mapSupabaseProduct(data)
}

export async function deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('خطأ في حذف المنتج:', error)
        return false
    }

    return true
}

export async function searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('id', { ascending: true })

    if (error) {
        console.error('خطأ في البحث عن المنتجات:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}

export async function getRelatedProducts(productId: number): Promise<Product[]> {
    const product = await getProductById(productId)

    if (!product || !product.relatedProducts || product.relatedProducts.length === 0) {
        return []
    }

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', product.relatedProducts)

    if (error) {
        console.error('خطأ في جلب المنتجات ذات الصلة:', error)
        return []
    }

    return data.map(mapSupabaseProduct)
}