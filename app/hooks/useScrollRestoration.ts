'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useScrollRestoration(key: string) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const scrollPositions = useRef<Map<string, number>>(new Map());
    const isRestoring = useRef(false);

    // حفظ موضع التمرير قبل مغادرة الصفحة
    useEffect(() => {
        const savePosition = () => {
            const pos = window.scrollY;
            scrollPositions.current.set(key, pos);
            // حفظ في sessionStorage كنسخة احتياطية
            try {
                sessionStorage.setItem(`scroll_${key}`, pos.toString());
            } catch (e) {
                // ignore
            }
        };

        // حفظ عند التمرير (للتحديث المستمر)
        const handleScroll = () => {
            scrollPositions.current.set(key, window.scrollY);
        };

        // حفظ قبل مغادرة الصفحة
        window.addEventListener('beforeunload', savePosition);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // حفظ عند النقر على أي رابط (للانتقالات الداخلية)
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link && link.href && !link.href.startsWith('javascript')) {
                savePosition();
            }
        };
        document.addEventListener('click', handleClick);

        return () => {
            savePosition(); // حفظ نهائي
            window.removeEventListener('beforeunload', savePosition);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('click', handleClick);
        };
    }, [key, pathname]); // يعيد التشغيل عند تغيير المسار

    // استعادة موضع التمرير عند تحميل الصفحة
    useEffect(() => {
        // نحاول الاستعادة من الذاكرة أولاً، ثم من sessionStorage
        const savedInMemory = scrollPositions.current.get(key);
        let savedScroll: number | null = savedInMemory ?? null;

        if (savedScroll === null) {
            try {
                const fromStorage = sessionStorage.getItem(`scroll_${key}`);
                if (fromStorage) {
                    savedScroll = parseInt(fromStorage);
                }
            } catch (e) {
                // ignore
            }
        }

        if (savedScroll !== null && savedScroll > 0 && !isRestoring.current) {
            isRestoring.current = true;

            // محاولات متعددة لاستعادة التمرير (لأن DOM قد لا يكون جاهزاً)
            const tryRestore = (attempts: number) => {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const targetScroll = Math.min(savedScroll!, maxScroll);

                if (targetScroll > 0 && attempts > 0) {
                    window.scrollTo({ top: targetScroll, behavior: 'instant' });

                    // التحقق من أن التمرير تم بنجاح
                    requestAnimationFrame(() => {
                        if (Math.abs(window.scrollY - targetScroll) > 50) {
                            // لم يتم التمرير بعد، حاول مرة أخرى
                            setTimeout(() => tryRestore(attempts - 1), 100);
                        } else {
                            // نجح التمرير
                            try {
                                sessionStorage.removeItem(`scroll_${key}`);
                            } catch (e) {
                                // ignore
                            }
                            setTimeout(() => {
                                isRestoring.current = false;
                            }, 200);
                        }
                    });
                } else {
                    isRestoring.current = false;
                }
            };

            tryRestore(5); // 5 محاولات
        }

        // تنظيف sessionStorage القديم
        return () => {
            try {
                sessionStorage.removeItem(`scroll_${key}`);
            } catch (e) {
                // ignore
            }
        };
    }, [key, pathname, searchParams]);
}