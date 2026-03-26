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

// ✅ دالة إرسال إشعار إلى n8n
async function notifyN8N(order: any) {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('⚠️ N8N_WEBHOOK_URL غير مضبوط - تخطي إرسال الإشعار');
            return;
        }

        // إرسال الإشعار في الخلفية دون انتظار الاستجابة
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: 'new_order',
                timestamp: new Date().toISOString(),
                order: {
                    id: order.id,
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    total_amount: order.total_amount,
                    items: order.items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variant: item.variant
                    })),
                    status: order.status,
                    created_at: order.created_at
                }
            })
        }).catch(err => console.error('❌ خطأ في إرسال الإشعار:', err));

        console.log('✅ تم إرسال الإشعار إلى n8n');
    } catch (error) {
        console.error('❌ فشل إرسال الإشعار إلى n8n:', error);
    }
}

// ✅ إضافة طلب جديد
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

    // 🔔 إرسال إشعار إلى n8n (لا ينتظر الاستجابة)
    notifyN8N(data).catch(err => console.error('خطأ غير متوقع في الإشعار:', err));

    return data;
}

// ✅ جلب جميع الطلبات
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

// ✅ جلب إحصائيات المبيعات
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

    const dailyStats: Record<string, { orders: number; revenue: number }> = {};

    data.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ar');
        if (!dailyStats[date]) {
            dailyStats[date] = { orders: 0, revenue: 0 };
        }
        dailyStats[date].orders += 1;
        dailyStats[date].revenue += order.total_amount;
    });

    const productSales: Record<string, any> = {};

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
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 10);

    return {
        total_orders: data.length,
        total_revenue: data.reduce((sum, o) => sum + o.total_amount, 0),
        average_order: data.length > 0 ? data.reduce((sum, o) => sum + o.total_amount, 0) / data.length : 0,
        daily_stats: Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats })),
        top_products: topProducts
    };
}

// ✅ جلب المنتجات الأكثر مبيعاً
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

    const productCount: Record<string, any> = {};

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
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, limit);
}

// ✅ تحديث حالة الطلب
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