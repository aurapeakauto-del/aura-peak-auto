'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { getProductById, getRelatedProducts, Product } from '@/app/lib/products';
import Ratings from '@/app/components/Ratings';
import { useToast } from '@/app/components/Toast';

interface Props {
    id: number;
}

export default function ProductDetailsClient({ id }: Props) {
    if (!id || isNaN(id)) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-[#2c2c2c] mb-4">خطأ في تحميل المنتج</h1>
                    <Link href="/products" className="px-6 py-3 bg-[#2c2c2c] text-white">
                        العودة للمنتجات
                    </Link>
                </div>
            </div>
        );
    }

    const router = useRouter();
    const { addMultipleToCart } = useCart();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [selectedImage, setSelectedImage] = useState(0);
    const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
    const [quantity, setQuantity] = useState(1);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);

        if (data) {
            const related = await getRelatedProducts(id);
            setRelatedProducts(related);

            if (data.variants && data.variants.length > 0) {
                const defaultVariants: Record<string, string> = {};
                data.variants.forEach(variant => {
                    defaultVariants[variant.name] = variant.options[0];
                });
                setSelectedVariants(defaultVariants);
            }
        }

        setLoading(false);
    };

    const increaseQuantity = () => {
        if (product && quantity < product.stock) {
            setQuantity(prev => prev + 1);
        } else {
            showToast(`الكمية المتوفرة هي ${product?.stock} قطع فقط`, 'warning');
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (!product.variants || product.variants.length === 0) {
            addMultipleToCart(product, [{ variant: '', quantity }]);
            showToast(`تمت إضافة ${quantity} قطع إلى السلة`, 'success');
        } else {
            const variantsList = Object.entries(variantQuantities).map(([key, qty]) => {
                const variantName = key.split('-')[1];
                return {
                    variant: variantName,
                    quantity: qty
                };
            });

            if (variantsList.length === 0) {
                showToast('الرجاء اختيار كمية واحدة على الأقل', 'warning');
                return;
            }

            addMultipleToCart(product, variantsList);
            setVariantQuantities({});
            showToast('تمت إضافة المنتجات إلى السلة', 'success');
        }
    };

    const shareProduct = (platform: string) => {
        const url = window.location.href;
        const text = `تعرّف على ${product?.name} من Aura Peak Auto`;

        const shareUrls: Record<string, string | (() => void)> = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            email: `mailto:?subject=${encodeURIComponent(product?.name || '')}&body=${encodeURIComponent(text + '\n\n' + url)}`,
            copy: () => {
                navigator.clipboard.writeText(url);
                showToast('تم نسخ الرابط', 'success');
            }
        };

        if (platform === 'copy') {
            (shareUrls.copy as () => void)();
        } else {
            window.open(shareUrls[platform] as string, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2c2c2c] border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">جاري تحميل المنتج...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-[#2c2c2c] mb-4">المنتج غير موجود</h1>
                    <Link
                        href="/products"
                        className="px-6 py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors"
                    >
                        العودة للمنتجات
                    </Link>
                </div>
            </div>
        );
    }

    const discountedPrice = product.discount
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    const isOutOfStock = product.stock === 0;
    const descriptionLines = product.description.split('\n');
    const shortDescription = descriptionLines.slice(0, 3).join('\n');
    const hasMoreLines = descriptionLines.length > 3;

    return (
        <div className="min-h-screen bg-[#faf7f2]">
            <div className="container mx-auto px-4 py-12">
                {/* رجوع */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#2c2c2c] mb-8 transition-colors"
                >
                    <span>→</span>
                    رجوع
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* قسم الصور */}
                    <div>
                        {/* الصورة الرئيسية */}
                        <div className="bg-white aspect-square flex items-center justify-center mb-4 border border-gray-200 shadow-sm overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[selectedImage] || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-6xl">📷</span>
                                )}
                            </div>
                        </div>

                        {/* الصور المصغرة */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`
                                            w-16 h-16 bg-white border-2 flex-shrink-0 overflow-hidden
                                            ${selectedImage === index
                                                ? 'border-[#2c2c2c]'
                                                : 'border-gray-200 hover:border-gray-400'
                                            }
                                        `}
                                    >
                                        <img
                                            src={img}
                                            alt={`${product.name} - ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* تفاصيل المنتج */}
                    <div>
                        {/* التصنيفات */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {product.categories?.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/products?category=${encodeURIComponent(cat)}`}
                                    className="text-xs bg-gray-200 text-[#2c2c2c] px-3 py-1 hover:bg-gray-300 transition-colors rounded"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-light text-[#2c2c2c] mt-2 mb-4">
                            {product.name}
                        </h1>

                        {/* السعر */}
                        <div className="mb-6">
                            {product.discount ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl text-[#2c2c2c] font-semibold">
                                        JD {discountedPrice.toFixed(2)}
                                    </span>
                                    <span className="text-lg text-gray-500 line-through">
                                        JD {product.price.toFixed(2)}
                                    </span>
                                    <span className="bg-red-100 text-red-800 px-3 py-1 text-sm rounded">
                                        وفر {product.discount}%
                                    </span>
                                </div>
                            ) : (
                                <span className="text-3xl text-[#2c2c2c] font-semibold">
                                    JD {product.price.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* أزرار المشاركة */}
                        {/* أزرار المشاركة - بشعارات حقيقية */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-gray-500 text-sm">مشاركة:</span>

                            {/* فيسبوك */}
                            <button
                                onClick={() => shareProduct('facebook')}
                                className="w-9 h-9 bg-[#1877f2] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
                                title="مشاركة على فيسبوك"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                                </svg>
                            </button>

                            {/* انستغرام */}
                            <button
                                onClick={() => shareProduct('instagram')}
                                className="w-9 h-9 bg-[#e4405f] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
                                title="مشاركة على انستغرام"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                                </svg>
                            </button>

                            {/* واتساب */}
                            <button
                                onClick={() => shareProduct('whatsapp')}
                                className="w-9 h-9 bg-[#25d366] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
                                title="مشاركة على واتساب"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.523 5.86L.053 23.353c-.097.377.213.736.597.64l5.493-1.463C7.878 22.446 9.874 23 12 23c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21c-1.823 0-3.54-.48-5.007-1.326l-3.677.98.98-3.677A8.963 8.963 0 0 1 3 12c0-4.962 4.038-9 9-9s9 4.038 9 9-4.038 9-9 9z" />
                                </svg>
                            </button>

                            {/* تويتر (X) */}
                            <button
                                onClick={() => shareProduct('twitter')}
                                className="w-9 h-9 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center"
                                title="مشاركة على X (تويتر)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </button>

                            {/* نسخ الرابط */}
                            <button
                                onClick={() => shareProduct('copy')}
                                className="w-9 h-9 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center"
                                title="نسخ الرابط"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>

                        {/* الشارات */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {product.freeShipping && (
                                <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded">
                                    🚚 توصيل مجاني
                                </span>
                            )}
                            {product.featured && (
                                <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded">
                                    ⭐ الأكثر طلباً
                                </span>
                            )}
                            {product.recommended && (
                                <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded">
                                    ✅ موصى به
                                </span>
                            )}
                        </div>

                        {/* ===== قسم الكمية أو المتغيرات ===== */}
                        {product.variants && product.variants.length > 0 ? (
                            <div className="mb-8 space-y-6">
                                {product.variants.map((variant) => (
                                    <div key={variant.name} className="p-4 bg-white border border-gray-200 rounded-lg">
                                        <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">{variant.name}</h3>
                                        <div className="space-y-3">
                                            {variant.options.map((option) => {
                                                const variantKey = `${variant.name}-${option}`;
                                                const qty = variantQuantities[variantKey] || 0;

                                                return (
                                                    <div key={option} className="flex items-center justify-between py-1">
                                                        <span className="text-[#2c2c2c] text-sm">{option}</span>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    const newQuantities = { ...variantQuantities };
                                                                    const current = newQuantities[variantKey] || 0;
                                                                    if (current > 0) {
                                                                        newQuantities[variantKey] = current - 1;
                                                                    } else {
                                                                        delete newQuantities[variantKey];
                                                                    }
                                                                    setVariantQuantities(newQuantities);
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="text-[#2c2c2c] w-8 text-center font-medium">
                                                                {qty}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setVariantQuantities({
                                                                        ...variantQuantities,
                                                                        [variantKey]: (variantQuantities[variantKey] || 0) + 1
                                                                    });
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
                                <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">الكمية</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={decreaseQuantity}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                    >
                                        −
                                    </button>
                                    <span className="text-[#2c2c2c] w-12 text-center font-medium text-lg">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={increaseQuantity}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                    >
                                        +
                                    </button>
                                    <span className="text-gray-500 text-sm mr-2">
                                        / {product.stock} متبقي
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* المخزون */}
                        <div className="mb-6">
                            {isOutOfStock ? (
                                <p className="text-red-600 text-sm">نفذت الكمية</p>
                            ) : (
                                <p className="text-gray-600 text-sm">
                                    الكمية المتوفرة: {product.stock} قطع
                                </p>
                            )}
                        </div>

                        {/* الوصف مع "أكمل القراءة" */}
                        <div className="mb-8">
                            <h2 className="text-[#2c2c2c] text-lg font-light mb-3">الوصف</h2>
                            <div className="text-gray-600 leading-relaxed">
                                {!showFullDescription ? (
                                    <>
                                        <p className="whitespace-pre-line">{shortDescription}</p>
                                        {hasMoreLines && (
                                            <button
                                                onClick={() => setShowFullDescription(true)}
                                                className="text-amber-600 hover:text-amber-700 text-sm mt-2 font-medium"
                                            >
                                                ... أكمل القراءة
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="whitespace-pre-line">{product.description}</p>
                                        <button
                                            onClick={() => setShowFullDescription(false)}
                                            className="text-amber-600 hover:text-amber-700 text-sm mt-2 font-medium"
                                        >
                                            عرض أقل
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* زر الإضافة */}
                        {isOutOfStock ? (
                            <button
                                disabled
                                className="w-full lg:w-auto px-12 py-4 bg-gray-200 text-gray-500 border border-gray-200 cursor-not-allowed text-lg font-light tracking-wider rounded"
                            >
                                غير متوفر مؤقتاً
                            </button>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                className="w-full lg:w-auto px-12 py-4 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors text-lg font-light tracking-wider rounded"
                            >
                                {product.variants && product.variants.length > 0 ? 'إضافة المختار إلى السلة' : 'إضافة إلى السلة'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* المنتجات المقترحة */}
            {relatedProducts.length > 0 && (
                <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-light text-[#2c2c2c] mb-8">
                        منتجات قد تعجبك
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedProducts
                            .filter(p => p.stock > 0)
                            .map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    href={`/products/${relatedProduct.id}`}
                                    className="group block bg-white border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all p-3 rounded-lg"
                                >
                                    <div className="bg-gray-50 aspect-square mb-3 flex items-center justify-center">
                                        {relatedProduct.image ? (
                                            <img
                                                src={relatedProduct.image}
                                                alt={relatedProduct.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-3xl">📷</span>
                                        )}
                                    </div>
                                    <h3 className="text-[#2c2c2c] text-sm font-medium truncate">
                                        {relatedProduct.name}
                                    </h3>
                                    <p className="text-[#2c2c2c] text-sm font-semibold mt-1">
                                        JD {(relatedProduct.discount
                                            ? relatedProduct.price - (relatedProduct.price * (relatedProduct.discount || 0) / 100)
                                            : relatedProduct.price).toFixed(2)}
                                    </p>
                                </Link>
                            ))}
                    </div>
                </div>
            )}

            {/* ✅ قسم التقييمات - الآن تحت المنتجات المقترحة */}
            <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200">
                <Ratings productId={product.id} />
            </div>
        </div>
    );
}