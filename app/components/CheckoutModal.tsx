'use client';

import { useCart } from '@/app/context/CartContext';
import { useState, useEffect } from 'react';
import { updateProduct } from '@/app/lib/products';
import { useToast } from './Toast';

interface CheckoutModalProps {
    onClose: () => void;
}

const GOVERNORATES = [
    'عمان', 'إربد', 'الزرقاء', 'البلقاء', 'المفرق', 'مادبا', 'جرش', 'عجلون',
    'الكرك', 'الطفيلة', 'معان', 'العقبة'
];

const PAYMENT_METHODS = [
    'كاش عند الاستلام',
    'تحويل بنكي',
    'كليك'
];

const DELIVERY_PRICE = 3;

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
    const { items, totalPrice, clearCart } = useCart();
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // ✅ استعادة بيانات العميل من localStorage
    const [fullName, setFullName] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ✅ تحميل البيانات المحفوظة عند فتح الـ Modal
    useEffect(() => {
        const saved = localStorage.getItem('checkout_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setFullName(data.fullName || '');
                setGovernorate(data.governorate || '');
                setCity(data.city || '');
                setStreet(data.street || '');
                setPhone(data.phone || '');
                setWhatsapp(data.whatsapp || '');
                setPaymentMethod(data.paymentMethod || '');
                setNotes(data.notes || '');
            } catch (e) {
                // ignore
            }
        }
    }, []);

    // ✅ حفظ البيانات تلقائياً عند تغير أي حقل
    useEffect(() => {
        const data = { fullName, governorate, city, street, phone, whatsapp, paymentMethod, notes };
        localStorage.setItem('checkout_data', JSON.stringify(data));
    }, [fullName, governorate, city, street, phone, whatsapp, paymentMethod, notes]);

    const finalTotal = totalPrice + DELIVERY_PRICE;

    const decreaseStock = async () => {
        setIsProcessing(true);
        let success = true;
        for (const cartItem of items) {
            try {
                const { getProductById } = await import('@/app/lib/products');
                const product = await getProductById(cartItem.id);
                if (product) {
                    const newStock = Math.max(0, product.stock - cartItem.quantity);
                    const updated = await updateProduct(cartItem.id, { stock: newStock });
                    if (!updated) success = false;
                }
            } catch (error) {
                console.error('خطأ في تحديث المخزون:', error);
                success = false;
            }
        }
        setIsProcessing(false);
        return success;
    };

    const saveOrder = async () => {
        try {
            const { addOrder } = await import('@/app/lib/orders');
            const orderData = {
                customer_name: fullName,
                customer_phone: whatsapp || phone,
                customer_email: '',
                total_amount: finalTotal,
                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    variant: item.variant || null,
                    image: item.image || ''
                })),
                status: 'جديد'
            };
            const result = await addOrder(orderData);
            // ✅ نرجع الـ order ID إذا نجح الحفظ
            if (result) return result.id;
            return null;
        } catch (error) {
            console.error('❌ خطأ في حفظ الطلب:', error);
            return null;
        }
    };

    const sendToTelegram = async (orderId: number) => {
        try {
            const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
            if (!botToken || !chatId) return false;

            let message = `🛒 *طلب جديد #${orderId}*\n`;
            message += '━━━━━━━━━━━━━━━━━━━━\n\n';
            message += `👤 *الاسم:* ${fullName}\n`;
            message += `📍 *المحافظة:* ${governorate}\n`;
            message += `🏘️ *المدينة/الحي:* ${city}\n`;
            message += `📍 *الشارع:* ${street}\n`;
            message += `📞 *الهاتف:* ${phone}\n`;
            if (whatsapp) message += `💬 *الواتساب:* ${whatsapp}\n`;
            message += `💳 *الدفع:* ${paymentMethod}\n`;
            if (notes) message += `📝 *ملاحظات:* ${notes}\n`;
            message += '\n━━━━━━━━━━━━━━━━━━━━\n';
            message += '📦 *المنتجات:*\n';
            items.forEach((item, i) => {
                message += `• ${item.name} (${item.quantity}x) - JD ${(item.price * item.quantity).toFixed(2)}\n`;
            });
            message += '\n';
            message += `📦 *مجموع المنتجات:* JD ${totalPrice.toFixed(2)}\n`;
            message += `🚚 *التوصيل:* JD ${DELIVERY_PRICE.toFixed(2)}\n`;
            message += '━━━━━━━━━━━━━━━━━━━━\n';
            message += `💰 *الإجمالي النهائي:* JD ${finalTotal.toFixed(2)}\n`;
            message += `🕐 ${new Date().toLocaleDateString('ar-JO')}`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
            return true;
        } catch (error) {
            console.error('خطأ في إرسال تيليجرام:', error);
            return false;
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!fullName.trim()) errs.fullName = 'الاسم مطلوب';
        if (!governorate) errs.governorate = 'المحافظة مطلوبة';
        if (!city.trim()) errs.city = 'الحي/المدينة مطلوب';
        if (!street.trim()) errs.street = 'الشارع مطلوب';
        if (!phone.trim()) errs.phone = 'رقم الهاتف مطلوب';
        else if (!/^0\d{8,9}$/.test(phone.trim())) errs.phone = 'رقم هاتف غير صحيح';
        if (whatsapp && !/^0\d{8,9}$/.test(whatsapp.trim())) errs.whatsapp = 'رقم واتساب غير صحيح';
        if (!paymentMethod) errs.paymentMethod = 'طريقة الدفع مطلوبة';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const stockSuccess = await decreaseStock();
        if (!stockSuccess) {
            showToast('حدث خطأ في تحديث المخزون', 'error');
            return;
        }

        const orderId = await saveOrder();
        if (orderId) {
            sendToTelegram(orderId);
            showToast('تم إرسال طلبك بنجاح!', 'success', 5000);
            clearCart();
            localStorage.removeItem('checkout_data'); // ✅ مسح البيانات بعد الطلب الناجح
            onClose();
        } else {
            showToast('فشل حفظ الطلب، حاول مرة أخرى', 'error');
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-xl p-6 z-[101] w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg" dir="rtl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[#2c2c2c] text-2xl font-light">إتمام الطلب</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[#2c2c2c] text-xl" disabled={isProcessing}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">المحافظة</label>
                        <select value={governorate} onChange={e => setGovernorate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">اختر المحافظة</option>
                            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {errors.governorate && <p className="text-red-500 text-xs mt-1">{errors.governorate}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">المدينة/الحي</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">الشارع</label>
                        <input type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">رقم الهاتف</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0791234567" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">رقم الواتساب (إذا كان مختلفاً)</label>
                        <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="0791234567" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">اختر طريقة الدفع</option>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ملاحظات إضافية</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>

                    {/* ✅ ملخص الطلب مع التوصيل قبل المجموع */}
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                        <h3 className="font-medium text-[#2c2c2c] text-sm">ملخص الطلب</h3>
                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>{item.name} ({item.quantity})</span>
                                <span>JD {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-sm border-t pt-1">
                            <span>📦 مجموع المنتجات</span>
                            <span>JD {totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>🚚 التوصيل</span>
                            <span>JD {DELIVERY_PRICE.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#2c2c2c] border-t pt-1">
                            <span>💰 الإجمالي</span>
                            <span>JD {finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500">⚠️ يرجى التأكد من صحة رقم الهاتف والواتساب لتأكيد الطلب.</p>

                    <button type="submit" disabled={isProcessing} className="w-full py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors text-sm font-medium rounded disabled:opacity-50">
                        {isProcessing ? 'جاري المعالجة...' : 'إتمام الطلب'}
                    </button>
                </form>
            </div>
        </>
    );
}