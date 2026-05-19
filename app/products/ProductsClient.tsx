'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAllProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import { Product } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';
import Link from 'next/link';

const ITEMS_PER_LOAD = 12;

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBest, setLoadingBest] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    // ✅ Infinite Scroll
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [loadingMore, setLoadingMore] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadProducts();
        loadBestSellers();
    }, []);

    // ✅ Intersection Observer للتحميل التلقائي
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && visibleCount < filteredProducts.length) {
                    setLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                        setLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [loadingMore, visibleCount, filteredProducts.length]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);

        const allCategories = [...new Set(data.flatMap(p => p.categories || []))].sort();
        setCategories(allCategories);

        setLoading(false);
    };

    const loadBestSellers = async () => {
        const data = await getBestSellers(10);
        setBestSellers(data);
        setLoadingBest(false);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '') return;

        if (value === 'الكل') {
            setSelectedCategories([]);
        } else if (!selectedCategories.includes(value)) {
            setSelectedCategories([...selectedCategories, value]);
        }
        setVisibleCount(ITEMS_PER_LOAD); // إعادة تعيين
    };

    const removeCategory = (category: string) => {
        setSelectedCategories(prev => prev.filter(c => c !== category));
        setVisibleCount(ITEMS_PER_LOAD);
    };

    const clearCategories = () => {
        setSelectedCategories([]);
        setVisibleCount(ITEMS_PER_LOAD);
    };

    const filteredProducts = useMemo(() => {
        if (!products.length) return [];

        return products.filter(product => {
            const matchesSearch = searchQuery === '' ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategories.length === 0 ||
                product.categories?.some(cat => selectedCategories.includes(cat));

            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategories]);

    // ✅ المنتجات الظاهرة حالياً
    const visibleProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    const hasMore = visibleCount < filteredProducts.length;
    const availableCategories = categories.filter(c => !selectedCategories.includes(c));

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
        <div className="min-h-screen bg-[#faf7f2]">
            {/* الهيدر */}
            <div className="border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#2c2c2c] tracking-wider">
                            جميع المنتجات
                        </h1>
                        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {filteredProducts.length} منتج
                        </span>
                    </div>
                </div>
            </div>

            {/* شريط الأكثر مبيعاً */}
            {!loadingBest && bestSellers.length > 0 && (
                <div className="border-b border-gray-200 bg-amber-50/50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <h2 className="text-base font-medium text-[#2c2c2c] mb-4 flex items-center gap-2">
                            <span className="text-amber-500 text-lg">⭐</span>
                            الأكثر مبيعاً
                        </h2>
                        <div className="overflow-x-auto scrollbar-hide pb-2">
                            <div className="flex gap-4 min-w-max">
                                {bestSellers.map((product: any) => (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.id}`}
                                        className="flex items-center gap-3 bg-white border border-gray-200 hover:border-amber-500 p-3 rounded-xl transition-all w-[280px] shadow-sm hover:shadow"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <span className="text-2xl">📷</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#2c2c2c] truncate">{product.name}</p>
                                            <p className="text-xs text-amber-600 font-semibold mt-0.5">JD {product.price?.toFixed(2)}</p>
                                        </div>
                                        <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                            {product.count}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-2/3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث عن منتج..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setVisibleCount(ITEMS_PER_LOAD);
                                }}
                                className="w-full px-4 py-3 sm:py-3.5 bg-white border border-gray-300 text-[#2c2c2c] placeholder-gray-400 focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm sm:text-base rounded-none"
                            />
                            <span className="absolute left-3 top-3 sm:top-3.5 text-gray-400">🔍</span>
                        </div>
                    </div>

                    <div className="w-full sm:w-1/3 relative">
                        <select
                            value=""
                            onChange={handleCategoryChange}
                            className="w-full px-4 py-3 sm:py-3.5 bg-white border border-gray-300 text-[#2c2c2c] focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm sm:text-base appearance-none cursor-pointer rounded-none"
                        >
                            <option value="">اختر تصنيف...</option>
                            {selectedCategories.length === 0 && (
                                <option value="الكل">الكل</option>
                            )}
                            {availableCategories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* علامات التصنيفات المختارة */}
                {selectedCategories.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className="text-gray-500 text-sm">التصنيفات المختارة:</span>
                        {selectedCategories.map(cat => (
                            <span key={cat} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2c2c2c] text-white text-sm">
                                {cat}
                                <button onClick={() => removeCategory(cat)}>✕</button>
                            </span>
                        ))}
                        <button onClick={clearCategories} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                            مسح الكل
                        </button>
                    </div>
                )}

                {searchQuery && (
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-gray-500 text-sm">الفلترة النشطة:</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm">
                            بحث: {searchQuery}
                            <button onClick={() => { setSearchQuery(''); setVisibleCount(ITEMS_PER_LOAD); }}>✕</button>
                        </span>
                    </div>
                )}
            </div>

            {/* Products Grid - Infinite Scroll */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {visibleProducts.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <p className="text-gray-500 text-base sm:text-lg">لا توجد منتجات مطابقة للبحث</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                clearCategories();
                                setVisibleCount(ITEMS_PER_LOAD);
                            }}
                            className="mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2c2c2c] text-white hover:bg-gray-700 transition-colors text-sm sm:text-base rounded-none"
                        >
                            إعادة تعيين
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                            {visibleProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="block"
                                >
                                    <ProductCard product={product} />
                                </Link>
                            ))}
                        </div>

                        {/* ✅ مؤشر التحميل للـ Infinite Scroll */}
                        <div ref={loaderRef} className="py-10 text-center">
                            {loadingMore && (
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>جاري تحميل المزيد...</span>
                                </div>
                            )}
                            {!hasMore && filteredProducts.length > ITEMS_PER_LOAD && (
                                <p className="text-gray-400 text-sm">تم عرض جميع المنتجات ✓</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}