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
    const [selectedCategory, setSelectedCategory] = useState<string>(
        searchParams.get('categories') || ''
    );
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            const [products, sellers] = await Promise.all([
                getAllProducts(),
                getBestSellers(),
            ]);
            setAllProducts(products);
            setBestSellers(sellers);
            const cats = Array.from(new Set(products.flatMap(p => p.categories)));
            setAllCategories(cats);
            setLoading(false);
        }
        load();
    }, []);

    // مزامنة URL
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedCategory) params.set('categories', selectedCategory);
        router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    }, [search, selectedCategory, router]);

    // حفظ التمرير + visibleCount عند النقر على منتج
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link?.href?.includes('/products/') && !link.href.endsWith('/products')) {
                sessionStorage.setItem('products_scroll', window.scrollY.toString());
                sessionStorage.setItem('products_visibleCount', visibleCount.toString());
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [visibleCount]);

    // استعادة التمرير و visibleCount بعد تحميل البيانات
    useEffect(() => {
        if (loading) return;

        const savedScroll = sessionStorage.getItem('products_scroll');
        const savedVisibleCount = sessionStorage.getItem('products_visibleCount');

        // استعادة visibleCount أولاً لضمان وجود محتوى كافٍ
        if (savedVisibleCount) {
            const vc = parseInt(savedVisibleCount);
            if (vc > visibleCount) {
                setVisibleCount(vc);
            }
        }

        // استعادة التمرير
        if (savedScroll) {
            const y = parseInt(savedScroll);
            if (y > 0) {
                // انتظر قليلاً حتى يتمدد المحتوى إذا تغير visibleCount
                const timer = setTimeout(() => {
                    requestAnimationFrame(() => {
                        window.scrollTo(0, y);
                    });
                }, 100);
                sessionStorage.removeItem('products_scroll');
                sessionStorage.removeItem('products_visibleCount');
                return () => clearTimeout(timer);
            }
        }
    }, [loading, visibleCount]);

    const filtered = useMemo(() => {
        return allProducts.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat = !selectedCategory || p.categories.includes(selectedCategory);
            return matchSearch && matchCat;
        });
    }, [allProducts, search, selectedCategory]);

    // Intersection Observer للتحميل اللانهائي
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

    const discountedPrice = (p: Product) =>
        p.discount ? p.price - (p.price * p.discount) / 100 : p.price;

    // معالج تغيير التصنيف من القائمة المنسدلة
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedCategory(value);
        setVisibleCount(ITEMS_PER_LOAD);
        window.scrollTo(0, 0);
    };

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
                            <Link
                                key={p.id}
                                href={`/products/${p.id}`}
                                className="flex-shrink-0 flex items-center gap-2 bg-[#faf7f2] border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors"
                            >
                                {p.image && (
                                    <img src={p.image} alt={p.name} width={36} height={36} className="w-9 h-9 object-cover rounded" />
                                )}
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
                        onChange={e => {
                            setSearch(e.target.value);
                            setVisibleCount(ITEMS_PER_LOAD);
                            window.scrollTo(0, 0);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    />
                    <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white min-w-[180px] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    >
                        <option value="">جميع التصنيفات</option>
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Product Grid */}
                {visibleProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg">لا توجد منتجات مطابقة</p>
                    </div>
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
                            {!hasMore && filtered.length > ITEMS_PER_LOAD && (
                                <p className="text-gray-400 text-sm">تم عرض جميع المنتجات ✓</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}