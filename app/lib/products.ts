import { supabase } from './supabase'

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
    freeShipping?: boolean;
    offer?: boolean;
    featured?: boolean;
    recommended?: boolean;
    stock: number;
    variants?: {
        name: string;
        options: string[];
    }[];
    relatedProducts?: number[];
}

// ✅ تحويل البيانات من Supabase إلى شكل Product
const mapSupabaseProduct = (data: any): Product => ({
    id: data.id,
    name: data.name,
    description: data.description || '',
    price: data.price,
    image: data.image || '/images/placeholder.jpg',
    images: data.images || [],
    categories: data.categories || [],
    discount: data.discount || 0,
    freeShipping: data.free_shipping || false,
    offer: data.offer || false,
    featured: data.featured || false,
    recommended: data.recommended || false,
    stock: data.stock || 0,
    variants: data.variants || [],
    relatedProducts: data.related_products || []
})

// ✅ تحويل Product إلى شكل Supabase
const toSupabaseProduct = (product: Partial<Product>) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    images: product.images || [],
    categories: product.categories || [],
    discount: product.discount || 0,
    free_shipping: product.freeShipping || false,
    offer: product.offer || false,
    featured: product.featured || false,
    recommended: product.recommended || false,
    stock: product.stock || 0,
    variants: product.variants || [],
    related_products: product.relatedProducts || []
})

// ============ دوال القراءة من Supabase ============

// ✅ جلب جميع المنتجات
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

// ✅ جلب منتج بواسطة ID
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

// ✅ جلب المنتجات المميزة (Featured)
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

// ✅ جلب المنتجات الموصى بها (Recommended)
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

// ✅ جلب منتجات ذات عرض خاص (Offer)
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

// ✅ جلب منتجات حسب التصنيف
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

// ✅ إضافة منتج جديد
export async function addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
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

    const { data, error } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select()
        .single()

    if (error) {
        console.error('خطأ في إضافة المنتج:', error)
        return null
    }

    return mapSupabaseProduct(data)
}

// ✅ تحديث منتج
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

// ✅ حذف منتج
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

// ✅ البحث في المنتجات
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

// ✅ جلب المنتجات ذات الصلة
export async function getRelatedProducts(productId: number): Promise<Product[]> {
    // أولاً جلب المنتج الحالي
    const product = await getProductById(productId)

    if (!product || !product.relatedProducts || product.relatedProducts.length === 0) {
        return []
    }

    // جلب المنتجات ذات الصلة
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