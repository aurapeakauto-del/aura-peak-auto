import { supabase } from './supabase';

export interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    total_amount: number;
    items: any[];
    status: string;
    created_at: string;
}

// إضافة طلب جديد
export async function addOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> {
    console.log('📤 محاولة إضافة طلب:', order);

    const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();

    if (error) {
        console.error('❌ خطأ في إضافة الطلب:', error);
        return null;
    }

    console.log('✅ تم إضافة الطلب بنجاح:', data);
    return data;
}

// جلب جميع الطلبات
export async function getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return [];
    }

    return data || [];
}

// جلب إحصائيات المبيعات
export async function getSalesStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

    if (error || !data) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return {
            total_orders: 0,
            total_revenue: 0,
            average_order: 0,
            daily_stats: []
        };
    }

    // إحصائيات يومية
    const dailyStats: Record<string, { orders: number; revenue: number }> = {};

    data.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ar');
        if (!dailyStats[date]) {
            dailyStats[date] = { orders: 0, revenue: 0 };
        }
        dailyStats[date].orders += 1;
        dailyStats[date].revenue += order.total_amount;
    });

    // أكثر المنتجات مبيعاً
    const productSales: Record<string, { name: string; quantity: number; revenue: number; image?: string; price: number }> = {};

    data.forEach(order => {
        order.items.forEach((item: any) => {
            const key = `${item.id}-${item.variant || ''}`;
            if (!productSales[key]) {
                productSales[key] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0,
                    image: item.image || '',
                    price: item.price
                };
            }
            productSales[key].quantity += item.quantity;
            productSales[key].revenue += item.price * item.quantity;
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    return {
        total_orders: data.length,
        total_revenue: data.reduce((sum, o) => sum + o.total_amount, 0),
        average_order: data.length > 0 ? data.reduce((sum, o) => sum + o.total_amount, 0) / data.length : 0,
        daily_stats: Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats })),
        top_products: topProducts
    };
}

// جلب المنتجات الأكثر مبيعاً
export async function getBestSellers(limit: number = 8) {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('items')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error || !orders) {
        console.error('خطأ في جلب الأكثر مبيعاً:', error);
        return [];
    }

    const productCount: Record<string, { id: string; name: string; image: string; price: number; count: number }> = {};

    orders.forEach(order => {
        order.items.forEach((item: any) => {
            const key = `${item.id}-${item.variant || ''}`;
            if (!productCount[key]) {
                productCount[key] = {
                    id: item.id,
                    name: item.name,
                    image: item.image || '',
                    price: item.price,
                    count: 0
                };
            }
            productCount[key].count += item.quantity;
        });
    });

    return Object.values(productCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// ✅ **الدالة الجديدة: تحديث حالة الطلب**
export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        return false;
    }

    return true;
}