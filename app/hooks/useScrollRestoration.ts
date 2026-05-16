'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useScrollRestoration(key: string) {
    const keyRef = useRef(key);
    keyRef.current = key;
    const isRestoring = useRef(false);
    const lastSavedRef = useRef(0);

    // حفظ موضع التمرير
    const savePosition = useCallback(() => {
        const pos = window.scrollY || document.documentElement.scrollTop;
        if (pos > 0) {
            lastSavedRef.current = pos;
            try {
                sessionStorage.setItem(`scroll_${keyRef.current}`, pos.toString());
            } catch (e) {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        // استعادة التمرير أول مرة فقط
        if (!isRestoring.current) {
            try {
                const saved = sessionStorage.getItem(`scroll_${keyRef.current}`);
                if (saved) {
                    const targetScroll = parseInt(saved);
                    if (targetScroll > 0) {
                        isRestoring.current = true;

                        const tryRestore = (attempts: number) => {
                            if (attempts <= 0) {
                                isRestoring.current = false;
                                return;
                            }

                            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                            const finalTarget = Math.min(targetScroll, Math.max(0, maxScroll));

                            window.scrollTo({ top: finalTarget, behavior: 'instant' });

                            requestAnimationFrame(() => {
                                const currentScroll = window.scrollY || document.documentElement.scrollTop;
                                if (Math.abs(currentScroll - finalTarget) > 50 && finalTarget > 0) {
                                    setTimeout(() => tryRestore(attempts - 1), 100);
                                } else {
                                    sessionStorage.removeItem(`scroll_${keyRef.current}`);
                                    setTimeout(() => {
                                        isRestoring.current = false;
                                    }, 200);
                                }
                            });
                        };

                        setTimeout(() => tryRestore(8), 100);
                    }
                }
            } catch (e) {
                // ignore
            }
        }

        // حفظ التمرير عند التمرير
        const handleScroll = () => {
            const pos = window.scrollY || document.documentElement.scrollTop;
            if (pos > 0) {
                lastSavedRef.current = pos;
            }
        };

        // حفظ عند النقر على الروابط
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link?.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                savePosition();
            }
        };

        // حفظ عند مغادرة الصفحة
        const handleBeforeUnload = () => {
            savePosition();
        };

        // حفظ عند الرجوع/التقدم (popstate)
        const handlePopState = () => {
            // سنستعيد في الدورة التالية
            isRestoring.current = false;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('click', handleClick);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        return () => {
            // حفظ نهائي عند الخروج
            if (lastSavedRef.current > 0) {
                try {
                    sessionStorage.setItem(`scroll_${keyRef.current}`, lastSavedRef.current.toString());
                } catch (e) {
                    // ignore
                }
            }
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('click', handleClick);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [savePosition]);
}