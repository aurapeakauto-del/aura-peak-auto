'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllProducts } from '@/app/lib/products';
import { Product } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';

export default function OffersClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [offerType, setOfferType] = useState('الكل');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
        setLoading(false);
    };

    const offerProducts = useMemo(() => {
        return products.filter(product =>
            (product.discount !== undefined && product.discount > 0) ||
            product.freeShipping === true
        );
    }, [products]);

    const offerTypes = ['الكل', 'خصم', 'توصيل مجاني'];

    const filteredOffers = useMemo(() => {
        return offerProducts.filter(product => {
            const matchesSearch = searchQuery === '' ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesOffer = true;
            if (offerType === 'خصم') {
                matchesOffer = product.discount !== undefined && product.discount > 0;
            } else if (offerType === 'توصيل مجاني') {
                matchesOffer = product.freeShipping === true;
            }

            return matchesSearch && matchesOffer;
        });
    }, [searchQuery, offerType, offerProducts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2c2c2c] border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">جاري تحميل العروض...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f2]">
            {/* الهيدر */}
            <div className="border-b border-gray-200">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-light text-[#2c2c2c] tracking-wider">
                        العروض والتخفيضات
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {filteredOffers.length} عرض متاح
                    </p>
                </div>
            </div>

            {/* شريط البحث والفلترة */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* شريط البحث */}
                    <div className="w-full md:w-2/3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث عن عرض..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] placeholder-gray-400 focus:border-[#2c2c2c] focus:outline-none transition-colors rounded-none"
                            />
                            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                        </div>
                    </div>

                    {/* قائمة منسدلة لأنواع العروض */}
                    <div className="w-full md:w-1/3">
                        <select
                            value={offerType}
                            onChange={(e) => setOfferType(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] focus:border-[#2c2c2c] focus:outline-none transition-colors appearance-none cursor-pointer rounded-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%234a5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'left 1rem center',
                                backgroundSize: '1.2rem',
                            }}
                        >
                            {offerTypes.map((type) => (
                                <option key={type} value={type} className="bg-white text-[#2c2c2c]">
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* عرض الفلترة النشطة */}
                <div className="flex items-center gap-2 mt-4">
                    <span className="text-gray-500 text-sm">الفلترة:</span>
                    {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm rounded">
                            بحث: {searchQuery}
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mr-1 text-gray-500 hover:text-[#2c2c2c]"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                    {offerType !== 'الكل' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm rounded">
                            {offerType}
                            <button
                                onClick={() => setOfferType('الكل')}
                                className="mr-1 text-gray-500 hover:text-[#2c2c2c]"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                </div>
            </div>

            {/* رسالة إذا مافي عروض */}
            {filteredOffers.length === 0 ? (
                <div className="container mx-auto px-4 py-16 text-center">
                    <p className="text-gray-500 text-lg">لا توجد عروض مطابقة للبحث</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setOfferType('الكل');
                        }}
                        className="mt-4 px-6 py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors rounded-none"
                    >
                        إعادة تعيين
                    </button>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOffers.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}