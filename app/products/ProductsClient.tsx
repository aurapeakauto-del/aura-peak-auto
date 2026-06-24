'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/app/components/ProductCard';
import { getAllProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import type { Product } from '@/app/lib/products';

const ITEMS_PER_LOAD = 12;

export default function ProductsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firstRender = useRef(true);

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get('categories')?.split(',').filter(Boolean) || []
    );
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            const [products, sellers] = await Promise.all([getAllProducts(), getBestSellers()]);
            setAllProducts(products);
            setBestSellers(sellers);
            setAllCategories(Array.from(new Set(products.flatMap(p => p.categories))));
            setLoading(false);
        }
        load();
    }, []);

    // ✅ مزامنة URL
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedCategories.length) params.set('categories', selectedCategories.join(','));
        router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    }, [search, selectedCategories, router]);

    // ✅ حفظ التمرير في URL عند النقر على منتج
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link?.href?.includes('/products/') && !link.href.endsWith('/products')) {
                const url = new URL(window.location.href);
                url.searchParams.set('scroll', window.scrollY.toString());
                window.history.replaceState({}, '', url.toString());
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // ✅ استعادة التمرير بعد التحميل
    useEffect(() => {
        if (loading) return;
        const scrollParam = searchParams.get('scroll');
        if (scrollParam) {
            const y = parseInt(scrollParam);
            if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
            const url = new URL(window.location.href);
            url.searchParams.delete('scroll');
            window.history.replaceState({}, '', url.toString());
        }
    }, [loading, searchParams]);

    const filtered = useMemo(() => {
        return allProducts.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat = selectedCategories.length === 0 || selectedCategories.some(c => p.categories.includes(c));
            return matchSearch && matchCat;
        });
    }, [allProducts, search, selectedCategories]);

    // ✅ Intersection Observer - Infinite Scroll
    useEffect(() => {
        const currentLoader = loaderRef.current;
        if (!currentLoader) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && visibleCount < filtered.length) {
                    setLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                        setLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(currentLoader);
        return () => observer.disconnect();
    }, [loadingMore, visibleCount, filtered.length]);

    const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
    const hasMore = visibleCount < filtered.length;

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        window.scrollTo(0, 0);
        setVisibleCount(ITEMS_PER_LOAD);
        if (!value) setSelectedCategories([]);
        else setSelectedCategories([value]);
    };

    const discountedPrice = (p: Product) => p.discount ? p.price - (p.price * p.discount) / 100 : p.price;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2c2c2c] border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">جاري تحميل المنتجات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f2] text-[#2c2c2c]" dir="rtl">
            {/* Best Sellers Bar */}
            {bestSellers.length > 0 && (
                <div className="bg-white border-b border-gray-200 py-3 px-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">الأكثر مبيعاً</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {bestSellers.map(p => (
                            <Link key={p.id} href={`/products/${p.id}`} scroll={false} className="flex-shrink-0 flex items-center gap-2 bg-[#faf7f2] border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors">
                                {p.image && <img src={p.image} alt={p.name} width={36} height={36} className="w-9 h-9 object-cover rounded" />}
                                <div className="text-right">
                                    <p className="text-xs font-medium text-[#1a1a1a] whitespace-nowrap max-w-[100px] truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500">JD {discountedPrice(p).toFixed(2)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search + Category Dropdown */}
                <div className="mb-6 flex gap-3 items-center">
                    <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            window.scrollTo(0, 0);
                            setVisibleCount(ITEMS_PER_LOAD);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    />
                    <select
                        value={selectedCategories[0] || ''}
                        onChange={handleCategoryChange}
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white min-w-[180px] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    >
                        <option value="">جميع التصنيفات</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {/* Product Grid - Infinite Scroll */}
                {visibleProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400"><p className="text-lg">لا توجد منتجات مطابقة</p></div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {visibleProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        <div ref={loaderRef} className="py-10 text-center">
                            {loadingMore && (
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>جاري تحميل المزيد...</span>
                                </div>
                            )}
                            {!hasMore && filtered.length > ITEMS_PER_LOAD && <p className="text-gray-400 text-sm">تم عرض جميع المنتجات ✓</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}