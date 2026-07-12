'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/app/components/ProductCard';
import { getAllProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import type { Product } from '@/app/lib/products';
import { FaSearch, FaFilter } from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

export default function ProductsClient() {
    const [showFilter, setShowFilter] = useState(false);
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
            setAllCategories(Array.from(new Set(products.flatMap(p => p.categories))));
            setLoading(false);
        }
        load();
    }, []);

    // مزامنة URL (بدون التسبب في إعادة تعيين الصفحة)
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (currentPage > 1) params.set('page', currentPage.toString());
        if (selectedCategory) params.set('categories', selectedCategory);
        const query = params.toString();
        router.replace(`/products${query ? '?' + query : ''}`, { scroll: false });
    }, [search, currentPage, selectedCategory, router]);

    // حفظ التمرير ورقم الصفحة عند النقر على منتج
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
    }, [currentPage]);

    // استعادة التمرير ورقم الصفحة بعد تحميل البيانات
    useEffect(() => {
        if (loading) return;

        const savedPage = sessionStorage.getItem('products_page');
        const savedScroll = sessionStorage.getItem('products_scroll');

        if (savedPage) {
            const page = parseInt(savedPage);
            if (page > 1) setCurrentPage(page);
            sessionStorage.removeItem('products_page');
        }

        if (savedScroll) {
            const y = parseInt(savedScroll);
            if (y > 0) {
                // انتظر حتى يتم عرض العناصر بعد تغيير الصفحة (إذا لزم)
                setTimeout(() => {
                    window.scrollTo(0, y);
                }, 50);
            }
            sessionStorage.removeItem('products_scroll');
        }
    }, [loading, currentPage]);

    const filtered = useMemo(() => {
        return allProducts.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat = !selectedCategory || p.categories.includes(selectedCategory);
            return matchSearch && matchCat;
        });
    }, [allProducts, search, selectedCategory]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    const discountedPrice = (p: Product) =>
        p.discount ? p.price - (p.price * p.discount) / 100 : p.price;

    // معالجات يدوية تضبط الصفحة للأولى عند تغيير المدخلات
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
        window.scrollTo(0, 0);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
        window.scrollTo(0, 0);
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
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
                {/* Search + Filter - متجاوب مع الهاتف */}
<div className="mb-6">
    {/* شريط البحث مع زر الفلترة */}
    <div className="flex gap-2 items-center">
        <div className="relative flex-1">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pr-10 pl-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] placeholder-gray-400 focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm rounded-lg"
            />
        </div>
        
        {/* زر الفلترة - يظهر فقط على الهاتف */}
        <button
            onClick={() => setShowFilter(!showFilter)}
            className={`lg:hidden flex items-center gap-2 px-4 py-3 border rounded-lg text-sm transition-colors ${
                showFilter || selectedCategory
                    ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
        >
            <FaFilter />
            {selectedCategory ? `(${1})` : ''}
        </button>
        
        {/* Select الفلترة - يظهر فقط على سطح المكتب */}
        <div className="hidden lg:block w-1/3">
            <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm appearance-none cursor-pointer rounded-lg"
            >
                <option value="">جميع التصنيفات</option>
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </div>
    </div>

    {/* قائمة الفلترة المنسدلة للهاتف */}
    {showFilter && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg lg:hidden">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        setSelectedCategory('');
                        setCurrentPage(1);
                        window.scrollTo(0, 0);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        !selectedCategory
                            ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                >
                    الكل
                </button>
                {allCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            setSelectedCategory(cat);
                            setCurrentPage(1);
                            window.scrollTo(0, 0);
                            setShowFilter(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedCategory === cat
                                ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {paginated.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-8">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    السابق
                                </button>
                                <span className="text-gray-700">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
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