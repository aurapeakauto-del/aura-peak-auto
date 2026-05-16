'use client';

import { useEffect, useRef } from 'react';

export function useScrollRestoration(key: string) {
    const scrollYRef = useRef<number>(0);

    // حفظ موضع التمرير عند المغادرة
    useEffect(() => {
        const handleScroll = () => {
            scrollYRef.current = window.scrollY;
        };

        const handleBeforeUnload = () => {
            sessionStorage.setItem(`scroll_${key}`, scrollYRef.current.toString());
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // حفظ عند إلغاء التحميل (الانتقال لصفحة أخرى)
            sessionStorage.setItem(`scroll_${key}`, scrollYRef.current.toString());
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [key]);

    // استعادة موضع التمرير عند التحميل
    useEffect(() => {
        const savedScroll = sessionStorage.getItem(`scroll_${key}`);
        if (savedScroll) {
            const scrollY = parseInt(savedScroll);
            // تأخير بسيط للتأكد من تحميل DOM بالكامل
            requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, behavior: 'instant' });
            });
            sessionStorage.removeItem(`scroll_${key}`);
        }
    }, [key]);
}