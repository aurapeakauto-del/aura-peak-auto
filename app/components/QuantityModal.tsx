'use client';

import { useState } from 'react';
import { Product } from '@/app/lib/products';
import { FaTimes, FaMinus, FaPlus } from 'react-icons/fa';

interface QuantityModalProps {
    product: Product;
    onClose: () => void;
    onAdd: (quantity: number) => void;
}

export default function QuantityModal({ product, onClose, onAdd }: QuantityModalProps) {
    const [quantity, setQuantity] = useState(1);

    const discountedPrice = product.discount
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    const maxQuantity = product.stock;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 
                    bg-white border border-gray-200 shadow-xl p-6
                    sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 rounded-lg">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#2c2c2c] text-lg sm:text-xl font-light">
                        اختر الكمية
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <p className="text-[#2c2c2c] text-sm sm:text-base mb-1 font-medium">{product.name}</p>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">JD {discountedPrice.toFixed(2)} للقطعة</p>
                <p className="text-gray-500 text-xs mb-4">المتوفر: {product.stock} قطع</p>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex-1 py-3 sm:py-4 border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors rounded flex items-center justify-center"
                        disabled={quantity <= 1}
                    >
                        <FaMinus size={16} />
                    </button>

                    <span className="text-[#2c2c2c] text-2xl sm:text-3xl font-light min-w-[50px] text-center">
                        {quantity}
                    </span>

                    <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="flex-1 py-3 sm:py-4 border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors rounded flex items-center justify-center"
                        disabled={quantity >= maxQuantity}
                    >
                        <FaPlus size={16} />
                    </button>
                </div>

                {quantity >= maxQuantity && (
                    <p className="text-amber-600 text-xs text-center mb-4">لا تتوفر كمية أكبر</p>
                )}

                {/* Total */}
                <div className="flex justify-between items-center mb-5 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">الإجمالي</span>
                    <span className="text-[#2c2c2c] text-lg sm:text-xl font-semibold">
                        JD {(discountedPrice * quantity).toFixed(2)}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => onAdd(quantity)}
                        className="flex-1 py-3 sm:py-4 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors text-sm sm:text-base font-medium rounded"
                    >
                        تأكيد
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 sm:py-4 border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm sm:text-base font-medium rounded"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </>
    );
}