'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllProducts } from '@/app/lib/products';
import { Product } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';
import { FaSearch, FaFilter, FaTimes, FaRedo, FaPercent, FaTruck } from 'react-icons/fa';

export default function OffersClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [offerType, setOfferType] = useState('الكل');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [allCategories, setAllCategories] = useState<string[]>([]);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
        const cats = Array.from(new Set(data.flatMap(p => p.categories || []))).sort();
        setAllCategories(cats);
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

            const matchesCategory = !selectedCategory || product.categories?.includes(selectedCategory);

            return matchesSearch && matchesOffer && matchesCategory;
        });
    }, [searchQuery, offerType, selectedCategory, offerProducts]);

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
                    <h1 className="text-3xl font-light text-[#2c2c2c] tracking-wider flex items-center gap-3">
                        <FaPercent className="text-amber-500" />
                        العروض والتخفيضات
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {filteredOffers.length} عرض متاح
                    </p>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث عن عرض..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] placeholder-gray-400 focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm rounded-lg"
                        />
                    </div>
                    
                    {/* زر الفلترة - يظهر فقط على الهاتف */}
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`lg:hidden flex items-center gap-2 px-4 py-3 border rounded-lg text-sm transition-colors ${
                            showFilter || offerType !== 'الكل' || selectedCategory
                                ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                    >
                        <FaFilter />
                        {(offerType !== 'الكل' || selectedCategory) ? `(${offerType !== 'الكل' ? 1 : 0}${selectedCategory ? 1 : 0})` : ''}
                    </button>
                    
                    {/* قوائم الفلترة - تظهر فقط على سطح المكتب */}
                    <div className="hidden lg:flex gap-2 w-auto">
                        <select
                            value={offerType}
                            onChange={(e) => setOfferType(e.target.value)}
                            className="px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm appearance-none cursor-pointer rounded-lg min-w-[160px]"
                        >
                            {offerTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] focus:border-[#2c2c2c] focus:outline-none transition-colors text-sm appearance-none cursor-pointer rounded-lg min-w-[160px]"
                        >
                            <option value="">جميع التصنيفات</option>
                            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* قائمة الفلترة المنسدلة للهاتف */}
                {showFilter && (
                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg lg:hidden space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">نوع العرض</p>
                            <div className="flex flex-wrap gap-2">
                                {offerTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => { setOfferType(type); setShowFilter(false); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                                            offerType === type ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        {type === 'خصم' ? <FaPercent size={10} /> : type === 'توصيل مجاني' ? <FaTruck size={10} /> : null}
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">التصنيفات</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { setSelectedCategory(''); setShowFilter(false); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                        !selectedCategory ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    الكل
                                </button>
                                {allCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); setShowFilter(false); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            selectedCategory === cat ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* عرض الفلترة النشطة */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="text-gray-500 text-sm">الفلترة:</span>
                    {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm rounded-full">
                            بحث: {searchQuery}
                            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-[#2c2c2c]"><FaTimes size={12} /></button>
                        </span>
                    )}
                    {offerType !== 'الكل' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm rounded-full">
                            {offerType === 'خصم' ? <FaPercent className="text-amber-500" /> : <FaTruck className="text-green-500" />}
                            {offerType}
                            <button onClick={() => setOfferType('الكل')} className="text-gray-500 hover:text-[#2c2c2c]"><FaTimes size={12} /></button>
                        </span>
                    )}
                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-[#2c2c2c] text-sm rounded-full">
                            {selectedCategory}
                            <button onClick={() => setSelectedCategory('')} className="text-gray-500 hover:text-[#2c2c2c]"><FaTimes size={12} /></button>
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
                            setSelectedCategory('');
                        }}
                        className="mt-4 px-6 py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors rounded-lg inline-flex items-center gap-2"
                    >
                        <FaRedo />
                        إعادة تعيين
                    </button>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredOffers.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}