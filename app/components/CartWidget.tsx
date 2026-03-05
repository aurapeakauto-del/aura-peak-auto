'use client';

import { useCart } from '@/app/context/CartContext';
import { useState, useEffect } from 'react';
import { useToast } from './Toast';

export default function CartWidget() {
    const { totalItems, openCart } = useCart();
    const { showToast } = useToast();
    const [isAnimating, setIsAnimating] = useState(false);
    const [prevTotal, setPrevTotal] = useState(totalItems);
   
    useEffect(() => {
        if (totalItems > prevTotal) {
            setIsAnimating(true);
            showToast('تمت إضافة المنتج إلى السلة', 'success'); 

            const timer = setTimeout(() => setIsAnimating(false), 500);
            return () => clearTimeout(timer);
        }
        setPrevTotal(totalItems);
    }, [totalItems, prevTotal, showToast]);

    return (
        <button
            onClick={openCart}
            className="relative group inline-block"
            aria-label="سلة التسوق"
        >
            <div className={`
                relative p-2.5 rounded-full transition-all duration-300
                ${isAnimating 
                    ? 'bg-amber-500 scale-110' 
                    : 'bg-gray-800 hover:bg-amber-600'
                }
            `}>
                <span className="text-white text-xl block transform group-hover:rotate-6 transition-transform">
                    🛒
                </span>

                {totalItems > 0 && (
                    <span className={`
                        absolute -top-1 -right-1 
                        bg-red-500 text-white 
                        text-xs font-bold 
                        min-w-[1.25rem] h-5 
                        flex items-center justify-center 
                        rounded-full px-1
                        transition-all duration-300
                        ${isAnimating ? 'scale-125 bg-red-600' : ''}
                    `}>
                        {totalItems}
                    </span>
                )}
            </div>

            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                text-xs text-gray-400 opacity-0 group-hover:opacity-100 
                transition-opacity duration-300 whitespace-nowrap">
                السلة
            </span>
        </button>
    );
}