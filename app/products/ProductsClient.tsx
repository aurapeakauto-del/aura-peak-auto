'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/app/components/ProductCard';
import { getAllProducts, getRelatedProducts } from '@/app/lib/products';
import { getBestSellers } from '@/app/lib/orders';
import type { Product } from '@/app/lib/products';

const ITEMS_PER_PAGE = 12;

export default function ProductsClient() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [displayed, setDisplayed] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            const [products, sellers] = await Promise.all([
                getAllProducts(),
                getBestSellers(),
            ]);
            setAllProducts(products);
            setBestSellers(sellers);
            const cats = Array.from(new Set(products.flatMap((p) => p.categories)));
            setAllCategories(cats);
        }
        load();
    }, []);

    const filtered = useCallback(() => {
        return allProducts.filter((p) => {
            const matchSearch =
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat =
                selectedCategories.length === 0 ||
                selectedCategories.some((c) => p.categories.includes(c));
            return matchSearch && matchCat;
        });
    }, [allProducts, search, selectedCategories]);

    useEffect(() => {
        const f = filtered();
        setDisplayed(f.slice(0, ITEMS_PER_PAGE));
        setPage(1);
        setHasMore(f.length > ITEMS_PER_PAGE);
    }, [filtered]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    const f = filtered();
                    const nextPage = page + 1;
                    const nextItems = f.slice(0, nextPage * ITEMS_PER_PAGE);
                    setDisplayed(nextItems);
                    setPage(nextPage);
                    setHasMore(nextItems.length < f.length);
                }
            },
            { threshold: 0.1 }
        );
        const el = loaderRef.current;
        if (el) observer.observe(el);
        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMore, page, filtered]);

    const openModal = async (productId: number) => {
        const product = allProducts.find((p) => p.id === productId);
        if (!product) return;
        setModalProduct(product);
        setLoadingModal(true);
        const related = await getRelatedProducts(productId);
        setRelatedProducts(related);
        setLoadingModal(false);
    };

    const closeModal = () => {
        setModalProduct(null);
        setRelatedProducts([]);
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const discountedPrice = (p: Product) =>
        p.discount ? p.price - (p.price * p.discount) / 100 : p.price;

    return (
        <div className="min-h-screen bg-[#faf7f2] text-[#2c2c2c]" dir="rtl">
            {/* Best Sellers Bar */}
            {bestSellers.length > 0 && (
                <div className="bg-white border-b border-gray-200 py-3 px-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">الأكثر مبيعاً</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {bestSellers.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => openModal(p.id)}
                                className="flex-shrink-0 flex items-center gap-2 bg-[#faf7f2] border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors"
                            >
                                {p.image && (
                                    <Image
                                        src={p.image}
                                        alt={p.name}
                                        width={36}
                                        height={36}
                                        className="w-9 h-9 object-cover rounded"
                                    />
                                )}
                                <div className="text-right">
                                    <p className="text-xs font-medium text-[#1a1a1a] whitespace-nowrap max-w-[100px] truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500">JD {discountedPrice(p).toFixed(2)}</p>
                                </div>
                            </button>
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
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors"
                    />
                    {allCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {allCategories.map((cat) => (
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
                {displayed.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg">لا توجد منتجات مطابقة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {displayed.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => openModal(product.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="h-10 mt-6" />
                {!hasMore && displayed.length > 0 && (
                    <p className="text-center text-sm text-gray-400 mt-2">تم عرض جميع المنتجات</p>
                )}
            </div>

            {/* Quick View Modal */}
            {modalProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="font-semibold text-[#1a1a1a] text-lg truncate">{modalProduct.name}</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-5">
                                {/* Image */}
                                <div className="sm:w-1/2">
                                    {modalProduct.image ? (
                                        <div className="relative w-full pt-[100%] bg-gray-50 rounded-xl overflow-hidden">
                                            <Image
                                                src={modalProduct.image}
                                                alt={modalProduct.name}
                                                fill
                                                className="object-cover"
                                            />
                                            {modalProduct.discount && modalProduct.discount > 0 && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    -{modalProduct.discount}%
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full pt-[100%] bg-gray-100 rounded-xl relative">
                                            <span className="absolute inset-0 flex items-center justify-center text-4xl">📷</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="sm:w-1/2 flex flex-col gap-3">
                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#1a1a1a]">
                                            JD {discountedPrice(modalProduct).toFixed(2)}
                                        </span>
                                        {modalProduct.discount && (
                                            <span className="text-sm text-gray-400 line-through">
                                                JD {modalProduct.price.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock */}
                                    <p className={`text-sm font-medium ${modalProduct.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {modalProduct.stock === 0 ? 'غير متوفر' : `متوفر - ${modalProduct.stock} قطعة`}
                                    </p>

                                    {/* Description */}
                                    {modalProduct.description && (
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                                            {modalProduct.description}
                                        </p>
                                    )}

                                    {/* Categories */}
                                    {modalProduct.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {modalProduct.categories.map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Free shipping badge */}
                                    {modalProduct.freeShipping && (
                                        <p className="text-xs text-green-600 font-medium">🚚 توصيل مجاني</p>
                                    )}

                                    {/* Full details link */}
                                    <Link
                                        href={`/products/${modalProduct.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto inline-block text-center w-full py-3 border-2 border-[#1a1a1a] text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-[#1a1a1a] hover:text-white transition-colors"
                                    >
                                        عرض التفاصيل الكاملة ↗
                                    </Link>
                                </div>
                            </div>

                            {/* Related Products */}
                            {!loadingModal && relatedProducts.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-3">منتجات ذات صلة</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {relatedProducts.map((rp) => (
                                            <button
                                                key={rp.id}
                                                onClick={() => openModal(rp.id)}
                                                className="flex-shrink-0 w-24 text-right hover:opacity-80 transition-opacity"
                                            >
                                                {rp.image && (
                                                    <div className="relative w-24 h-24 bg-gray-50 rounded-lg overflow-hidden mb-1">
                                                        <Image src={rp.image} alt={rp.name} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <p className="text-xs text-[#1a1a1a] font-medium truncate">{rp.name}</p>
                                                <p className="text-xs text-gray-500">JD {discountedPrice(rp).toFixed(2)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {loadingModal && (
                                <div className="mt-4 flex justify-center">
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1a1a1a] rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}