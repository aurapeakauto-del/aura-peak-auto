'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/app/components/ProductCard';
import { getAllProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import type { Product } from '@/app/lib/products';

const ITEMS_PER_PAGE = 12;

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
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [loading, setLoading] = useState(true);

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

    // ✅ مزامنة الحالة مع URL - مع منع أول تنفيذ
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (currentPage > 1) params.set('page', currentPage.toString());
        if (selectedCategories.length) params.set('categories', selectedCategories.join(','));
        const query = params.toString();
        router.replace(`/products${query ? '?' + query : ''}`, { scroll: false });
    }, [search, currentPage, selectedCategories, router]);

    // ✅ حفظ التمرير عند النقر على منتج
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link?.href?.includes('/products/') && !link.href.endsWith('/products')) {
                sessionStorage.setItem('products_scroll', window.scrollY.toString());
                sessionStorage.setItem('products_page', currentPage.toString());
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // ✅ استعادة التمرير بعد تحميل المنتجات
    useEffect(() => {
        if (loading) return;

        const saved = sessionStorage.getItem('products_scroll');
        const savedPage = sessionStorage.getItem('products_page');

        if (saved) {
            const y = parseInt(saved);
            if (y > 0) {
                requestAnimationFrame(() => window.scrollTo(0, y));
            }
            sessionStorage.removeItem('products_scroll');
        }

        if (savedPage) {
            setCurrentPage(parseInt(savedPage));
            sessionStorage.removeItem('products_page');
        }
    }, [loading]);

    const filtered = useMemo(() => {
        return allProducts.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat = selectedCategories.length === 0 || selectedCategories.some(c => p.categories.includes(c));
            return matchSearch && matchCat;
        });
    }, [allProducts, search, selectedCategories]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    // ✅ إعادة تعيين الصفحة عند تغيير البحث أو التصنيفات
    useEffect(() => {
        setCurrentPage(1);
        window.scrollTo(0, 0);
    }, [search, selectedCategories]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const discountedPrice = (p: Product) =>
        p.discount ? p.price - (p.price * p.discount) / 100 : p.price;

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
                {/* Search & Filters */}
                <div className="mb-6 space-y-3">
                    <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    />
                    {allCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCategories.includes(cat)
                                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                            {selectedCategories.length > 0 && (
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    مسح الفلاتر
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                {paginated.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg">لا توجد منتجات مطابقة</p>
                    </div>
                ) : (
                    <>
                        {/* ⚠️ هام: بدون Link خارجي - ProductCard يحتوي على Link داخلي */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {paginated.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 mt-8">
                                    <button
                                        onClick={() => {
                                            setCurrentPage(p => Math.max(1, p - 1));
                                            window.scrollTo(0, 0);
                                        }}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        السابق
                                    </button>
                                    <span className="text-gray-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setCurrentPage(p => Math.min(totalPages, p + 1));
                                            window.scrollTo(0, 0);
                                        }}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        التالي
                                    </button>
                                </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}