'use client';

import { useCart } from '@/app/context/CartContext';
import { useToast } from './Toast';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function FloatingCart() {
    const { totalItems, openCart } = useCart();
    const { showToast } = useToast();
    const [isAnimating, setIsAnimating] = useState(false);
    const prevTotalRef = useRef(totalItems);
    const toastShownRef = useRef(false); // ✅ لمنع تكرار الـ toast

    useEffect(() => {
        // ✅ فقط إذا زاد العدد
        if (totalItems > prevTotalRef.current) {
            setIsAnimating(true);
            
            // ✅ منع تكرار الـ toast
            if (!toastShownRef.current) {
                showToast('تمت إضافة منتج إلى السلة', 'success');
                toastShownRef.current = true;
            }
            
            const timer = setTimeout(() => {
                setIsAnimating(false);
                toastShownRef.current = false; // ✅ إعادة التعيين بعد انتهاء التأثير
            }, 500);
            
            return () => clearTimeout(timer);
        }
        prevTotalRef.current = totalItems;
    }, [totalItems]); // ✅ إزالة showToast من الـ dependencies

    if (totalItems === 0) return null;

    return (
        <button
            onClick={openCart}
            className="fixed bottom-6 left-6 z-50 group"
            aria-label="سلة التسوق"
        >
            <div className={`
                relative p-4 rounded-full shadow-2xl transition-all duration-300
                ${isAnimating 
                    ? 'bg-amber-500 scale-110' 
                    : 'bg-gray-900 hover:bg-amber-600'
                }
            `}>
                <span className="text-white text-2xl block transform group-hover:rotate-6 transition-transform">
                    🛒
                </span>

                {totalItems > 0 && (
                    <span className={`
                        absolute -top-2 -right-2 
                        bg-red-500 text-white 
                        text-xs font-bold 
                        min-w-[1.5rem] h-6 
                        flex items-center justify-center 
                        rounded-full px-1.5
                        transition-all duration-300
                        ${isAnimating ? 'scale-125 bg-red-600' : ''}
                    `}>
                        {totalItems}
                    </span>
                )}
            </div>

            <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 
                text-xs bg-gray-900 text-white px-2 py-1 rounded 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                عرض السلة
            </span>
        </button>
    );
}