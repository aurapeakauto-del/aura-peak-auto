'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import { Product } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';
import Link from 'next/link';
import { useScrollRestoration } from '@/app/hooks/useScrollRestoration';

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBest, setLoadingBest] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // ✅ حفظ واستعادة موضع التمرير
    useScrollRestoration('products-page');

    useEffect(() => {
        loadProducts();
        loadBestSellers();
    }, []);

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

    // ✅ دالة toggle للتصنيف
    const toggleCategory = (category: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
        setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلتر
    };

    // ✅ دالة مسح كل التصنيفات
    const clearCategories = () => {
        setSelectedCategories([]);
        setCurrentPage(1);
    };

    const filteredProducts = useMemo(() => {
        if (!products.length) return [];

        return products.filter(product => {
            const matchesSearch = searchQuery === '' ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase());

            // ✅ فلترة متعددة: المنتج يطابق إذا كان لديه أي من التصنيفات المختارة
            const matchesCategory = selectedCategories.length === 0 ||
                product.categories?.some(cat => selectedCategories.includes(cat));

            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategories]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
            {/* الهيدر - عنوان أصغر مع العدد بجانبه */}
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
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
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
                <div className="flex flex-col gap-4">
                    {/* شريط البحث */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-3 sm:py-3.5 bg-white border border-gray-300 text-[#2c2c2c] placeholder-gray-400 focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm sm:text-base rounded-none"
                        />
                        <span className="absolute left-3 top-3 sm:top-3.5 text-gray-400">🔍</span>
                    </div>

                    {/* ✅ فلترة متعددة - أزرار Checkbox بدلاً من Select */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500 font-medium">التصنيفات:</span>
                            {selectedCategories.length > 0 && (
                                <button
                                    onClick={clearCategories}
                                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                >
                                    مسح الكل
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => {
                                const isSelected = selectedCategories.includes(category);
                                return (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={`px-3 py-1.5 text-sm border transition-all cursor-pointer
                                            ${isSelected
                                                ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {category}
                                        {isSelected && <span className="mr-1">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {categories.length === 0 && (
                            <p className="text-gray-400 text-xs">لا توجد تصنيفات متاحة</p>
                        )}
                    </div>
                </div>

                {/* ✅ علامات الفلترة النشطة */}
                {(searchQuery || selectedCategories.length > 0) && (
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className="text-gray-500 text-sm">الفلترة النشطة:</span>
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm">
                                بحث: {searchQuery}
                                <button onClick={() => setSearchQuery('')}>✕</button>
                            </span>
                        )}
                        {selectedCategories.map(cat => (
                            <span key={cat} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2c2c2c] text-white text-sm">
                                {cat}
                                <button onClick={() => toggleCategory(cat)}>✕</button>
                            </span>
                        ))}
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                clearCategories();
                            }}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                            إعادة تعيين الكل
                        </button>
                    </div>
                )}
            </div>

            {/* Products Grid */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {paginatedProducts.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <p className="text-gray-500 text-base sm:text-lg">لا توجد منتجات مطابقة للبحث</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                clearCategories();
                                setCurrentPage(1);
                            }}
                            className="mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2c2c2c] text-white hover:bg-gray-700 transition-colors text-sm sm:text-base rounded-none"
                        >
                            إعادة تعيين
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                            {paginatedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-10">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
                                >
                                    السابق
                                </button>
                                <span className="text-gray-700">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
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