'use client';

import { useState, useEffect } from 'react';
import { getSalesStats, getAllOrders } from '@/app/lib/orders';
import Link from 'next/link';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        setLoading(true);
        const [statsData, ordersData] = await Promise.all([
            getSalesStats(period),
            getAllOrders()
        ]);
        setStats(statsData);
        setOrders(ordersData);
        setLoading(false);
    };

    // حساب إجمالي الربح
    const calculateTotalProfit = () => {
        if (!orders.length) return 0;
        return orders.reduce((sum, order) => sum + (order.total_profit || 0), 0);
    };

    // حساب متوسط الربح لكل طلب
    const calculateAverageProfit = () => {
        if (!orders.length) return 0;
        return calculateTotalProfit() / orders.length;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">جاري تحميل التقارير...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* الهيدر */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-light tracking-wider">التقارير والإحصائيات</h1>
                    <Link
                        href="/admin"
                        className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                    >
                        العودة للوحة التحكم
                    </Link>
                </div>

                {/* اختيار الفترة */}
                <div className="mb-8 flex gap-4">
                    {[7, 30, 90, 365].map(days => (
                        <button
                            key={days}
                            onClick={() => setPeriod(days)}
                            className={`px-4 py-2 transition-colors ${
                                period === days
                                    ? 'bg-white text-black'
                                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                            }`}
                        >
                            آخر {days} يوم
                        </button>
                    ))}
                </div>

                {/* بطاقات الإحصائيات - مع إضافة الربح */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gray-900 border border-gray-800 p-6">
                            <p className="text-gray-400 text-sm mb-2">إجمالي الطلبات</p>
                            <p className="text-3xl font-light">{stats.total_orders}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-6">
                            <p className="text-gray-400 text-sm mb-2">إجمالي المبيعات</p>
                            <p className="text-3xl font-light">JD {stats.total_revenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-6">
                            <p className="text-gray-400 text-sm mb-2">إجمالي الربح</p>
                            <p className="text-3xl font-light text-green-500">JD {calculateTotalProfit().toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-6">
                            <p className="text-gray-400 text-sm mb-2">متوسط الربح/طلب</p>
                            <p className="text-3xl font-light text-amber-500">JD {calculateAverageProfit().toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* أكثر المنتجات مبيعاً مع الربح */}
                {stats && stats.top_products.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-light mb-4">أكثر المنتجات مبيعاً</h2>
                        <div className="bg-gray-900 border border-gray-800 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">المنتج</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الكمية المباعة</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الإيرادات</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الربح التقديري</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {stats.top_products.map((product: any, index: number) => {
                                        // هنا يمكنك جلب سعر التكلفة من قاعدة البيانات
                                        // حالياً نستخدم نسبة ربح تقديرية 30%
                                        const estimatedProfit = product.revenue * 0.3;
                                        
                                        return (
                                            <tr key={index} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-4">{product.name}</td>
                                                <td className="px-6 py-4">{product.quantity}</td>
                                                <td className="px-6 py-4">JD {product.revenue.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-green-500">JD {estimatedProfit.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* جدول الطلبات مع الربح */}
                <div>
                    <h2 className="text-xl font-light mb-4">جميع الطلبات</h2>
                    <div className="bg-gray-900 border border-gray-800 overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">#</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">العميل</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">المبلغ</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">الربح</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">نسبة الربح</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">الحالة</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">التاريخ</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {orders.map((order) => {
                                    // حساب الربح (إذا لم يكن محفوظاً، نستخدم نسبة تقديرية)
                                    const profit = order.total_profit || (order.total_amount * 0.3);
                                    const profitMargin = ((profit / order.total_amount) * 100).toFixed(1);
                                    
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4">{order.id}</td>
                                            <td className="px-6 py-4">{order.customer_name}</td>
                                            <td className="px-6 py-4">JD {order.total_amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-green-500">JD {profit.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-amber-500">{profitMargin}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs ${
                                                    order.status === 'جديد' ? 'bg-blue-900 text-blue-300' :
                                                    order.status === 'مكتمل' ? 'bg-green-900 text-green-300' :
                                                    'bg-gray-800 text-gray-400'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString('ar')}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    عرض
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* نافذة تفاصيل الطلب مع عرض الربح */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-light">تفاصيل الطلب #{selectedOrder.id}</h3>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm">العميل</p>
                                        <p className="text-white">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">رقم الهاتف</p>
                                        <p className="text-white">{selectedOrder.customer_phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm mb-2">المنتجات</p>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item: any, index: number) => {
                                            // سعر التكلفة تقديري (70% من سعر البيع)
                                            const costPrice = item.price * 0.7;
                                            const profit = (item.price - costPrice) * item.quantity;
                                            
                                            return (
                                                <div key={index} className="flex justify-between bg-gray-800 p-3">
                                                    <div>
                                                        <p className="text-white">{item.name}</p>
                                                        <p className="text-gray-400 text-sm">الكمية: {item.quantity}</p>
                                                        <p className="text-gray-400 text-xs">سعر البيع: JD {item.price}</p>
                                                        <p className="text-gray-400 text-xs">سعر التكلفة: JD {costPrice.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-white">JD {(item.price * item.quantity).toFixed(2)}</p>
                                                        <p className="text-green-500 text-sm">ربح: JD {profit.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 border-t border-gray-800">
                                    <span className="text-gray-400">المجموع</span>
                                    <span className="text-white text-xl">JD {selectedOrder.total_amount.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-400">الربح الإجمالي</span>
                                    <span className="text-green-500 text-xl">
                                        JD {(selectedOrder.total_amount * 0.3).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    <select
                                        value={selectedOrder.status}
                                        onChange={async (e) => {
                                            // تحديث الحالة
                                            const { updateOrderStatus } = await import('@/app/lib/orders');
                                            await updateOrderStatus(selectedOrder.id, e.target.value);
                                            loadData();
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-white"
                                    >
                                        <option value="جديد">جديد</option>
                                        <option value="قيد التحضير">قيد التحضير</option>
                                        <option value="تم الشحن">تم الشحن</option>
                                        <option value="مكتمل">مكتمل</option>
                                        <option value="ملغي">ملغي</option>
                                    </select>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="px-6 py-3 bg-gray-800 text-white hover:bg-gray-700"
                                    >
                                        إغلاق
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}