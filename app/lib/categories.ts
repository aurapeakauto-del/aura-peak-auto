// app/lib/categories.ts
import { supabase } from './supabase';
import { getAllProducts } from './products';

export interface Category {
    id: number;
    name: string;
    slug: string;
    productCount?: number;
}

// التصنيفات الافتراضية (للاستخدام الأولي)
export const defaultCategories: Category[] = [
    { id: 1, name: 'داخلية', slug: 'interior', productCount: 0 },
    { id: 2, name: 'خارجية', slug: 'exterior', productCount: 0 },
    { id: 3, name: 'إلكترونيات', slug: 'electronics', productCount: 0 },
    { id: 4, name: 'عطور', slug: 'perfumes', productCount: 0 },
    { id: 5, name: 'إضاءة', slug: 'lighting', productCount: 0 },
];

// ✅ تحويل البيانات من Supabase إلى شكل Category
const mapSupabaseCategory = (data: any): Category => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
});

// ✅ تحويل Category إلى شكل Supabase
const toSupabaseCategory = (category: Partial<Category>) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
});

// ============ دوال القراءة من Supabase ============

// ✅ جلب جميع التصنيفات
export async function getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('خطأ في جلب التصنيفات:', error);
        return [];
    }

    return data.map(mapSupabaseCategory);
}

// ✅ إضافة تصنيف جديد
export async function addCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
    // الحصول على أقصى ID + 1
    const { data: maxIdData } = await supabase
        .from('categories')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

    const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    const supabaseCategory = toSupabaseCategory({
        ...category,
        id: newId
    });

    const { data, error } = await supabase
        .from('categories')
        .insert([supabaseCategory])
        .select()
        .single();

    if (error) {
        console.error('خطأ في إضافة التصنيف:', error);
        return null;
    }

    return mapSupabaseCategory(data);
}

// ✅ تحديث تصنيف
export async function updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
    const supabaseUpdates = toSupabaseCategory(updates);

    const { data, error } = await supabase
        .from('categories')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('خطأ في تحديث التصنيف:', error);
        return null;
    }

    return mapSupabaseCategory(data);
}

// ✅ حذف تصنيف
export async function deleteCategory(id: number): Promise<boolean> {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('خطأ في حذف التصنيف:', error);
        return false;
    }

    return true;
}

// ✅ دالة لحساب عدد المنتجات في كل تصنيف
export async function getCategoryProductCounts(): Promise<Record<string, number>> {
    const products = await getAllProducts();
    const counts: Record<string, number> = {};

    products.forEach(product => {
        if (product.categories) {
            product.categories.forEach(category => {
                counts[category] = (counts[category] || 0) + 1;
            });
        }
    });

    return counts;
}

// ✅ دالة لجلب التصنيفات مع عدد المنتجات
export async function getCategoriesWithCounts(): Promise<Category[]> {
    const categories = await getAllCategories();
    const counts = await getCategoryProductCounts();

    return categories.map(cat => ({
        ...cat,
        productCount: counts[cat.name] || 0
    }));
}

// ✅ تهيئة التصنيفات الافتراضية (للاستخدام الأول)
export async function initializeDefaultCategories(): Promise<void> {
    const existing = await getAllCategories();

    if (existing.length === 0) {
        for (const cat of defaultCategories) {
            await addCategory({
                name: cat.name,
                slug: cat.slug,
            });
        }
        console.log('✅ تم إنشاء التصنيفات الافتراضية');
    }
}