'use client';

import { useEffect } from 'react';

const SCROLL_KEY = 'products_scroll';

// حفظ التمرير الحالي
export function saveScrollPosition() {
    if (typeof window !== 'undefined') {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        sessionStorage.setItem(SCROLL_KEY, scrollY.toString());
    }
}

// استعادة التمرير عند تحميل الصفحة
export function useScrollRestoration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const saved = sessionStorage.getItem(SCROLL_KEY);

        if (saved) {
            const y = parseInt(saved);
            if (y > 0) {
                // استعادة التمرير بعد تحميل DOM
                const restore = () => {
                    window.scrollTo({ top: y, behavior: 'instant' });
                    sessionStorage.removeItem(SCROLL_KEY);
                };

                // المحاولة الأولى
                restore();

                // محاولة إضافية بعد تحميل الصور
                window.addEventListener('load', () => {
                    setTimeout(restore, 200);
                }, { once: true });

                // محاولة أخيرة
                setTimeout(restore, 500);
            }
        }
    }, []);
}