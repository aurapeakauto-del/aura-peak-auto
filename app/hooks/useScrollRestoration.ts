'use client';

import { useEffect } from 'react';

const SCROLL_KEY = 'products_scroll';

export function saveScrollPosition() {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    }
}

export function useScrollRestoration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const saved = sessionStorage.getItem(SCROLL_KEY);

        if (saved) {
            const y = parseInt(saved);
            if (y > 0) {
                // انتظار تحميل الصور ثم استعادة التمرير
                const restore = () => {
                    window.scrollTo({ top: y, behavior: 'instant' });
                    sessionStorage.removeItem(SCROLL_KEY);
                };

                // محاولة أولى بعد 100ms
                setTimeout(restore, 100);

                // محاولة ثانية بعد تحميل كل الصور
                window.addEventListener('load', restore, { once: true });
            }
        }
    }, []);
}