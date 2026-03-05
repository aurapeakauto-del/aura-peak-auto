'use client';

import { useCart } from '@/app/context/CartContext';
import { useState } from 'react';
import { updateProduct } from '@/app/lib/products';
import { useToast } from './Toast';

interface CheckoutModalProps {
    onClose: () => void;
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
    const { items, totalPrice, clearCart } = useCart();
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // دالة تنقيص الكمية من المخزون
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

                    if (!updated) {
                        success = false;
                    }
                }
            } catch (error) {
                console.error('خطأ في تحديث المخزون:', error);
                success = false;
            }
        }

        setIsProcessing(false);
        return success;
    };

    // ✅ دالة حفظ الطلب في Supabase
    // ✅ دالة حفظ الطلب في Supabase (مع تشخيص)
    const saveOrder = async () => {
        try {
            const { addOrder } = await import('@/app/lib/orders');

            const orderData = {
                customer_name: 'عميل',
                customer_phone: '0798072373',
                customer_email: '',
                total_amount: totalPrice,
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

            console.log('✅ محاولة حفظ الطلب:', orderData);

            const result = await addOrder(orderData);

            if (result) {
                console.log('✅ تم حفظ الطلب بنجاح:', result);
                return true;
            } else {
                console.log('❌ فشل حفظ الطلب (النتيجة فارغة)');
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في حفظ الطلب:', error);
            return false;
        }
    };

    const generateMessage = () => {
        let message = '🛍️ *طلب جديد من Aura Peak Auto*\n\n';
        message += '📦 *المنتجات المطلوبة:*\n';

        items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   - الكمية: ${item.quantity}\n`;
            message += `   - السعر: JD ${item.price.toFixed(2)}\n`;
        });

        message += `\n💰 *المجموع الكلي:* JD ${totalPrice.toFixed(2)}\n`;
        message += '\n📍 *الرجاء إرسال الموقع للتوصيل*\n';
        message += '✨ شكراً لاختيارك Aura Peak Auto';

        return encodeURIComponent(message);
    };

    const handleWhatsApp = async () => {
        const stockSuccess = await decreaseStock();
        if (stockSuccess) {
            const orderSuccess = await saveOrder(); // ✅ حفظ الطلب
            if (orderSuccess) {
                const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '962798072373';
                window.open(`https://wa.me/${whatsappNumber}?text=${generateMessage()}`, '_blank');
                showToast('تم إرسال طلبك بنجاح!', 'success', 5000);
                clearCart();
                onClose();
            } else {
                showToast('تم تحديث المخزون ولكن فشل حفظ الطلب', 'warning');
            }
        } else {
            showToast('حدث خطأ في تحديث المخزون', 'error');
        }
    };

    const handleMessenger = async () => {
        const stockSuccess = await decreaseStock();
        if (stockSuccess) {
            const orderSuccess = await saveOrder(); // ✅ حفظ الطلب
            if (orderSuccess) {
                window.open(`https://m.me/892099713996082`, '_blank');
                navigator.clipboard.writeText(decodeURIComponent(generateMessage()));
                showToast('تم نسخ الطلب! أرسله في المحادثة', 'success');
                clearCart();
                onClose();
            } else {
                showToast('تم تحديث المخزون ولكن فشل حفظ الطلب', 'warning');
            }
        } else {
            showToast('حدث خطأ في تحديث المخزون', 'error');
        }
    };

    const groupedItems = items.reduce((acc, item) => {
        const key = item.variant ? `${item.id}-${item.variant}` : `${item.id}`;
        acc[key] = item;
        return acc;
    }, {} as Record<string, any>);

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-xl p-6 z-[101] w-96 max-w-[90%] rounded-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-[#2c2c2c] text-2xl font-light">تأكيد الطلب</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[#2c2c2c] text-xl" disabled={isProcessing}>✕</button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 pr-1">
                    <p className="text-gray-600 text-sm mb-3">المنتجات المختارة:</p>
                    <div className="space-y-3">
                        {Object.values(groupedItems).map((item, index) => {
                            const displayName = item.variant ? `${item.name.split(' - ')[0]} - ${item.variant}` : item.name;
                            return (
                                <div key={`${item.id}-${item.variant || ''}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <div className="flex-1">
                                        <span className="text-[#2c2c2c] text-sm font-medium block">{displayName}</span>
                                        <span className="text-gray-500 text-xs">الكمية: {item.quantity}</span>
                                    </div>
                                    <span className="text-[#2c2c2c] text-sm font-semibold">JD {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center py-3 border-t border-gray-200 mt-2">
                    <span className="text-[#2c2c2c] font-medium">المجموع</span>
                    <span className="text-[#2c2c2c] text-xl font-semibold">JD {totalPrice.toFixed(2)}</span>
                </div>

                <p className="text-gray-600 text-sm mb-4 text-center">اختر منصة التواصل لإرسال الطلب</p>

                <div className="space-y-3">
                    <div>
                        <button
                            onClick={handleWhatsApp}
                            disabled={isProcessing}
                            className="w-full py-3.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-light flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <span className="text-xl">📱</span>
                            {isProcessing ? 'جاري المعالجة...' : 'واتساب'}
                        </button>
                        <p className="text-gray-400 text-xs text-center mt-1">يفضله المستخدم للتواصل السريع</p>
                    </div>

                    <button
                        onClick={handleMessenger}
                        disabled={isProcessing}
                        className="w-full py-3.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-light flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <span className="text-xl">💬</span>
                        {isProcessing ? 'جاري المعالجة...' : 'ماسنجر'}
                    </button>
                </div>

                <p className="text-gray-500 text-xs mt-4 text-center">سيتم تفريغ السلة بعد إرسال الطلب</p>
            </div>
        </>
    );
}