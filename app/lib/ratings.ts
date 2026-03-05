import { supabase } from './supabase';

export interface Rating {
    id: number;
    product_id: number;
    user_name: string;
    rating: number;
    comment?: string;
    created_at: string;
}

// جلب تقييمات منتج معين
export async function getProductRatings(productId: number): Promise<Rating[]> {
    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('خطأ في جلب التقييمات:', error);
        return [];
    }

    return data || [];
}

// إضافة تقييم جديد
export async function addRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating | null> {
    const { data, error } = await supabase
        .from('ratings')
        .insert([rating])
        .select()
        .single();

    if (error) {
        console.error('خطأ في إضافة التقييم:', error);
        return null;
    }

    return data;
}

// حساب متوسط التقييمات لمنتج
export async function getProductAverageRating(productId: number): Promise<{ average: number; count: number }> {
    const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('product_id', productId);

    if (error || !data || data.length === 0) {
        return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
    const average = sum / data.length;

    return {
        average: Math.round(average * 10) / 10, // تقريب لرقم عشري واحد
        count: data.length
    };
}