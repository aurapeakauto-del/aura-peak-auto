'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useScrollRestoration(key: string) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isRestoring = useRef(false);
    const keyRef = useRef(key);
    keyRef.current = key;

    useEffect(() => {
        if (isRestoring.current) return;

        const currentKey = keyRef.current;
        const saved = sessionStorage.getItem(`scroll_${currentKey}`);

        if (saved) {
            const targetScroll = parseInt(saved);
            if (targetScroll > 0) {
                isRestoring.current = true;

                const tryRestore = (attempts: number) => {
                    if (attempts <= 0) {
                        isRestoring.current = false;
                        sessionStorage.removeItem(`scroll_${currentKey}`);
                        return;
                    }

                    window.scrollTo({ top: targetScroll, behavior: 'instant' });

                    requestAnimationFrame(() => {
                        if (Math.abs(window.scrollY - targetScroll) > 50 && targetScroll > 0) {
                            setTimeout(() => tryRestore(attempts - 1), 100);
                        } else {
                            sessionStorage.removeItem(`scroll_${currentKey}`);
                            setTimeout(() => { isRestoring.current = false; }, 300);
                        }
                    });
                };

                setTimeout(() => tryRestore(5), 50);
            }
        }

        // حفظ عند مغادرة الصفحة
        const handleBeforeUnload = () => {
            sessionStorage.setItem(`scroll_${currentKey}`, window.scrollY.toString());
        };

        // حفظ عند النقر على الروابط
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link?.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                sessionStorage.setItem(`scroll_${currentKey}`, window.scrollY.toString());
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleClick);

        return () => {
            sessionStorage.setItem(`scroll_${currentKey}`, window.scrollY.toString());
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleClick);
        };
    }, [pathname, searchParams]);
}