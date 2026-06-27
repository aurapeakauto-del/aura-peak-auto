'use client';

import { useState, useEffect } from 'react';
import { getSalesStats, getAllOrders } from '@/app/lib/orders';
import Link from 'next/link';
import {
    FaChartBar, FaShoppingCart, FaDollarSign, FaMoneyBillWave,
    FaPercentage, FaCalendarAlt, FaArrowRight, FaTimes,
    FaBox, FaUser, FaPhone, FaCheck, FaTruck, FaSpinner
} from 'react-icons/fa';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => { loadData(); }, [period]);

    const loadData = async () => {
        setLoading(true);
        const [statsData, ordersData] = await Promise.all([getSalesStats(period), getAllOrders()]);
        setStats(statsData);
        setOrders(ordersData);
        setLoading(false);
    };

    const calculateTotalProfit = () => orders.reduce((sum, order) => sum + (order.total_profit || 0), 0);
    const calculateAverageProfit = () => orders.length ? calculateTotalProfit() / orders.length : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="text-4xl animate-spin mx-auto mb-4 text-amber-500" />
                    <p className="text-gray-400">جاري تحميل التقارير...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wider flex items-center gap-3">
                            <FaChartBar className="text-amber-500" />
                            التقارير والإحصائيات
                        </h1>
                        <p className="text-gray-500 mt-2">تحليل المبيعات والأرباح</p>
                    </div>
                    <Link
                        href="/admin"
                        className="px-5 py-2.5 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors rounded-lg flex items-center gap-2"
                    >
                        <FaArrowRight /> العودة للوحة التحكم
                    </Link>
                </div>

                {/* اختيار الفترة */}
                <div className="mb-8 flex gap-2 flex-wrap">
                    {[7, 30, 90, 365].map(days => (
                        <button
                            key={days}
                            onClick={() => setPeriod(days)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${period === days
                                    ? 'bg-white text-black font-medium'
                                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
                                }`}
                        >
                            <FaCalendarAlt />
                            آخر {days} يوم
                        </button>
                    ))}
                </div>

                {/* بطاقات الإحصائيات */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <FaShoppingCart className="text-blue-400" />
                                </div>
                                <p className="text-gray-400 text-sm">إجمالي الطلبات</p>
                            </div>
                            <p className="text-3xl font-light">{stats.total_orders}</p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <FaDollarSign className="text-amber-400" />
                                </div>
                                <p className="text-gray-400 text-sm">إجمالي المبيعات</p>
                            </div>
                            <p className="text-3xl font-light">JD {stats.total_revenue.toFixed(2)}</p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <FaMoneyBillWave className="text-green-400" />
                                </div>
                                <p className="text-gray-400 text-sm">إجمالي الربح</p>
                            </div>
                            <p className="text-3xl font-light text-green-500">JD {calculateTotalProfit().toFixed(2)}</p>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <FaPercentage className="text-purple-400" />
                                </div>
                                <p className="text-gray-400 text-sm">متوسط الربح/طلب</p>
                            </div>
                            <p className="text-3xl font-light text-amber-500">JD {calculateAverageProfit().toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* أكثر المنتجات مبيعاً */}
                {stats && stats.top_products.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                            <FaBox className="text-amber-500" />
                            أكثر المنتجات مبيعاً
                        </h2>
                        <div className="bg-gray-900 border border-gray-800 overflow-hidden rounded-lg">
                            <table className="w-full">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">المنتج</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الكمية المباعة</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الإيرادات</th>
                                        <th className="px-6 py-4 text-right text-gray-400 font-light">الربح التقديري</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {stats.top_products.map((product: any, index: number) => {
                                        const estimatedProfit = product.revenue * 0.3;
                                        return (
                                            <tr key={index} className="hover:bg-gray-800/30 transition-colors">
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

                {/* جميع الطلبات */}
                <div>
                    <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                        <FaShoppingCart className="text-amber-500" />
                        جميع الطلبات
                    </h2>
                    <div className="bg-gray-900 border border-gray-800 overflow-x-auto rounded-lg">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-800/50">
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
                                    const profit = order.total_profit || (order.total_amount * 0.3);
                                    const profitMargin = ((profit / order.total_amount) * 100).toFixed(1);
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 text-amber-500 font-mono">#{order.id}</td>
                                            <td className="px-6 py-4">{order.customer_name}</td>
                                            <td className="px-6 py-4">JD {order.total_amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-green-500">JD {profit.toFixed(2)}</td>
                                            <td className="px-6 py-4"><span className="text-amber-500">{profitMargin}%</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'جديد' ? 'bg-blue-500/20 text-blue-300' :
                                                        order.status === 'مكتمل' ? 'bg-green-500/20 text-green-300' :
                                                            order.status === 'ملغي' ? 'bg-red-500/20 text-red-300' :
                                                                'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">{new Date(order.created_at).toLocaleDateString('ar')}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => setSelectedOrder(order)} className="text-amber-500 hover:text-amber-400 transition-colors">
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

                {/* نافذة تفاصيل الطلب */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-light flex items-center gap-2">
                                    <FaBox className="text-amber-500" />
                                    تفاصيل الطلب #{selectedOrder.id}
                                </h3>
                                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1"><FaUser /> العميل</p>
                                        <p className="text-white">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1"><FaPhone /> رقم الهاتف</p>
                                        <p className="text-white" dir="ltr">{selectedOrder.customer_phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-1"><FaBox /> المنتجات</p>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between bg-gray-800 p-3 rounded-lg">
                                                <div>
                                                    <p className="text-white text-sm">{item.name}</p>
                                                    <p className="text-gray-400 text-xs">الكمية: {item.quantity}</p>
                                                    <p className="text-gray-500 text-xs">سعر الوحدة: JD {item.price}</p>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-white font-medium">JD {(item.price * item.quantity).toFixed(2)}</p>
                                                    <p className="text-green-500 text-xs">ربح تقديري: JD {(item.price * item.quantity * 0.3).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 border-t border-gray-700">
                                    <span className="text-gray-400">المجموع</span>
                                    <span className="text-white text-xl">JD {selectedOrder.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">الربح التقديري</span>
                                    <span className="text-green-500 text-lg">JD {(selectedOrder.total_amount * 0.3).toFixed(2)}</span>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <select
                                        value={selectedOrder.status}
                                        onChange={async (e) => {
                                            const { updateOrderStatus } = await import('@/app/lib/orders');
                                            await updateOrderStatus(selectedOrder.id, e.target.value);
                                            loadData();
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg"
                                    >
                                        <option value="جديد">جديد</option>
                                        <option value="قيد التحضير">قيد التحضير</option>
                                        <option value="تم الشحن">تم الشحن</option>
                                        <option value="مكتمل">مكتمل</option>
                                        <option value="ملغي">ملغي</option>
                                    </select>
                                    <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2">
                                        <FaTimes /> إغلاق
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