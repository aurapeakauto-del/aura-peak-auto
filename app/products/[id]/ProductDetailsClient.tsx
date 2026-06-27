'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { getProductById, getRelatedProducts, Product, VehicleFitment } from '@/app/lib/products';
import Ratings from '@/app/components/Ratings';
import { useToast } from '@/app/components/Toast';
import VehicleFitmentSelector from './VehicleFitmentSelector';
import { FaArrowRight, FaFacebook, FaWhatsapp, FaTwitter, FaCopy, FaTruck, FaStar, FaCheckCircle, FaImage, FaCartPlus, FaMinus, FaPlus } from 'react-icons/fa';

interface Props {
    id: number;
}

interface SelectedVariant {
    variant: string;
    quantity: number;
    extraPrice: number;
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
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>({});

    useEffect(() => {
        loadProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
        if (data) {
            const related = await getRelatedProducts(id);
            setRelatedProducts(related);
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
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const [selectedFitment, setSelectedFitment] = useState<{
        fitment: VehicleFitment;
        quantity: number;
        finalPrice: number;
    } | null>(null);

    const getDiscountedPrice = (price: number) => {
        if (product?.discount) return price - (price * product.discount / 100);
        return price;
    };

    const baseDiscountedPrice = product ? getDiscountedPrice(product.price) : 0;

    const handleAddToCart = () => {
        if (!product) return;
        if ((!product.variants || product.variants.length === 0) && (!product.vehicleFitments || product.vehicleFitments.length === 0)) {
            addMultipleToCart(product, [{ variant: '', quantity }]);
            showToast(`تمت إضافة ${quantity} قطع إلى السلة`, 'success');
            return;
        }
        const variantsList = Object.values(selectedVariants).filter(v => v.quantity > 0).map(({ variant, quantity, extraPrice }) => ({ variant, quantity, extraPrice }));
        const fitmentList = selectedFitment && selectedFitment.quantity > 0 ? [{ variant: `${selectedFitment.fitment.make} ${selectedFitment.fitment.model} (${selectedFitment.fitment.year})`, quantity: selectedFitment.quantity, extraPrice: selectedFitment.fitment.extraPrice }] : [];
        const allItems = [...variantsList, ...fitmentList];
        if (allItems.length === 0) { showToast('الرجاء اختيار كمية واحدة على الأقل', 'warning'); return; }
        addMultipleToCart(product, allItems);
        setSelectedVariants({});
        setSelectedFitment(null);
        showToast('تمت إضافة المنتجات إلى السلة', 'success');
    };

    const updateVariantQuantity = (variantKey: string, optionName: string, extraPrice: number, delta: number, maxStock: number) => {
        setSelectedVariants(prev => {
            const current = prev[variantKey];
            const newQuantity = (current?.quantity || 0) + delta;
            if (newQuantity <= 0) { const { [variantKey]: _, ...rest } = prev; return rest; }
            if (newQuantity <= maxStock) return { ...prev, [variantKey]: { variant: optionName, quantity: newQuantity, extraPrice } };
            showToast(`الكمية المتوفرة هي ${maxStock} قطع`, 'warning');
            return prev;
        });
    };

    const shareProduct = (platform: string) => {
        const url = window.location.href;
        const text = `تعرّف على ${product?.name} من Aura Peak Auto`;
        const shareUrls: Record<string, string | (() => void)> = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            copy: () => { navigator.clipboard.writeText(url); showToast('تم نسخ الرابط', 'success'); }
        };
        if (platform === 'copy') (shareUrls.copy as () => void)();
        else window.open(shareUrls[platform] as string, '_blank');
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
                    <Link href="/products" className="px-6 py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors">العودة للمنتجات</Link>
                </div>
            </div>
        );
    }

    const descriptionLines = product.description.split('\n');
    const shortDescription = descriptionLines.slice(0, 3).join('\n');
    const hasMoreLines = descriptionLines.length > 3;
    const displayPrice = baseDiscountedPrice;

    return (
        <div className="min-h-screen bg-[#faf7f2]">
            <div className="container mx-auto px-4 py-12">
                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#2c2c2c] mb-8 transition-colors">
                    <FaArrowRight /> رجوع
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <div className="bg-white aspect-square flex items-center justify-center mb-4 border border-gray-200 shadow-sm overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {product.images && product.images.length > 0 ? (
                                    <img src={product.images[selectedImage] || product.image} alt={product.name} className="w-full h-full object-contain" />
                                ) : product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                ) : (
                                    <FaImage size={64} className="text-gray-300" />
                                )}
                            </div>
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                                {product.images.map((img, index) => (
                                    <button key={index} onClick={() => setSelectedImage(index)} className={`w-16 h-16 bg-white border-2 flex-shrink-0 overflow-hidden ${selectedImage === index ? 'border-[#2c2c2c]' : 'border-gray-200 hover:border-gray-400'}`}>
                                        <img src={img} alt={`${product.name} - ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {product.categories?.map((cat) => (
                                <Link key={cat} href={`/products?category=${encodeURIComponent(cat)}`} className="text-xs bg-gray-200 text-[#2c2c2c] px-3 py-1 hover:bg-gray-300 transition-colors rounded">{cat}</Link>
                            ))}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-light text-[#2c2c2c] mt-2 mb-4">{product.name}</h1>

                        <div className="mb-6">
                            {product.discount ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl text-[#2c2c2c] font-semibold">JD {displayPrice.toFixed(2)}</span>
                                    <span className="text-lg text-gray-500 line-through">JD {product.price.toFixed(2)}</span>
                                    <span className="bg-red-100 text-red-800 px-3 py-1 text-sm rounded">وفر {product.discount}%</span>
                                </div>
                            ) : (
                                <span className="text-3xl text-[#2c2c2c] font-semibold">JD {displayPrice.toFixed(2)}</span>
                            )}
                        </div>

                        {/* أزرار المشاركة */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-gray-500 text-sm">مشاركة:</span>
                            <button onClick={() => shareProduct('facebook')} className="w-9 h-9 bg-[#1877f2] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"><FaFacebook size={16} /></button>
                            <button onClick={() => shareProduct('whatsapp')} className="w-9 h-9 bg-[#25d366] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"><FaWhatsapp size={18} /></button>
                            <button onClick={() => shareProduct('twitter')} className="w-9 h-9 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center"><FaTwitter size={16} /></button>
                            <button onClick={() => shareProduct('copy')} className="w-9 h-9 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center"><FaCopy size={14} /></button>
                        </div>

                        {/* الشارات */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {product.freeShipping && <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded flex items-center gap-1"><FaTruck /> توصيل مجاني</span>}
                            {product.featured && <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded flex items-center gap-1"><FaStar /> الأكثر طلباً</span>}
                            {product.recommended && <span className="bg-gray-200 text-[#2c2c2c] px-4 py-2 text-sm rounded flex items-center gap-1"><FaCheckCircle /> موصى به</span>}
                        </div>

                        {/* المتغيرات */}
                        {product.variants && product.variants.length > 0 ? (
                            <div className="mb-8 space-y-6">
                                {product.variants.map((variant) => (
                                    <div key={variant.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                                        <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">{variant.name}</h3>
                                        <div className="space-y-3">
                                            {variant.options.map((option) => {
                                                const variantKey = `${variant.name}-${option.name}`;
                                                const selected = selectedVariants[variantKey];
                                                const qty = selected?.quantity || 0;
                                                const finalPrice = baseDiscountedPrice + option.extraPrice;
                                                return (
                                                    <div key={option.name} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0 flex-wrap sm:flex-nowrap gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[#2c2c2c] text-sm">{option.name}</span>
                                                            {option.extraPrice !== 0 && (
                                                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${option.extraPrice > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                                    {option.extraPrice > 0 ? `+ JD ${option.extraPrice}` : `- JD ${Math.abs(option.extraPrice)}`}
                                                                </span>
                                                            )}
                                                            <span className="text-gray-400 text-xs">(متوفر: {option.stock})</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => updateVariantQuantity(variantKey, option.name, option.extraPrice, -1, option.stock)} className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded disabled:opacity-50" disabled={qty === 0}><FaMinus size={12} /></button>
                                                            <span className="text-[#2c2c2c] w-8 text-center font-medium">{qty}</span>
                                                            <button onClick={() => updateVariantQuantity(variantKey, option.name, option.extraPrice, 1, option.stock)} className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded" disabled={qty >= option.stock}><FaPlus size={12} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {Object.values(selectedVariants).reduce((a, b) => a + b.quantity, 0) > 0 && (
                                    <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <span className="text-[#2c2c2c] font-medium">إجمالي القطع المختارة:</span>
                                            <span className="text-[#2c2c2c] text-xl font-semibold">{Object.values(selectedVariants).reduce((a, b) => a + b.quantity, 0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
                                <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">الكمية</h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={decreaseQuantity} className="w-10 h-10 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"><FaMinus size={14} /></button>
                                    <span className="text-[#2c2c2c] w-12 text-center font-medium text-lg">{quantity}</span>
                                    <button onClick={increaseQuantity} className="w-10 h-10 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"><FaPlus size={14} /></button>
                                    <span className="text-gray-500 text-sm mr-2">/ {product.stock} متبقي</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            {product.stock === 0 ? <p className="text-red-600 text-sm">نفذت الكمية</p> : <p className="text-gray-600 text-sm">الكمية المتوفرة: {product.stock} قطع</p>}
                        </div>

                        <div className="mb-8">
                            <h2 className="text-[#2c2c2c] text-lg font-light mb-3">الوصف</h2>
                            <div className="text-gray-600 leading-relaxed">
                                {!showFullDescription ? (
                                    <>
                                        <p className="whitespace-pre-line">{shortDescription}</p>
                                        {hasMoreLines && <button onClick={() => setShowFullDescription(true)} className="text-amber-600 hover:text-amber-700 text-sm mt-2 font-medium">... أكمل القراءة</button>}
                                    </>
                                ) : (
                                    <>
                                        <p className="whitespace-pre-line">{product.description}</p>
                                        <button onClick={() => setShowFullDescription(false)} className="text-amber-600 hover:text-amber-700 text-sm mt-2 font-medium">عرض أقل</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {product.vehicleFitments && product.vehicleFitments.length > 0 && (
                            <VehicleFitmentSelector fitments={product.vehicleFitments} basePrice={product.price} discount={product.discount} onSelect={setSelectedFitment} />
                        )}

                        {product.stock === 0 ? (
                            <button disabled className="w-full lg:w-auto px-12 py-4 bg-gray-200 text-gray-500 border border-gray-200 cursor-not-allowed text-lg font-light tracking-wider rounded">غير متوفر مؤقتاً</button>
                        ) : (
                            <button onClick={handleAddToCart} className="w-full lg:w-auto px-12 py-4 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors text-lg font-light tracking-wider rounded flex items-center justify-center gap-2">
                                <FaCartPlus size={20} />
                                {product.variants && product.variants.length > 0 ? 'إضافة المختار إلى السلة' : 'إضافة إلى السلة'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {relatedProducts.length > 0 && (
                <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-light text-[#2c2c2c] mb-8">منتجات قد تعجبك</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedProducts.filter(p => p.stock > 0).map((relatedProduct) => (
                            <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`} className="group block bg-white border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all p-3 rounded-lg">
                                <div className="bg-gray-50 aspect-square mb-3 flex items-center justify-center">
                                    {relatedProduct.image ? <img src={relatedProduct.image} alt={relatedProduct.name} className="w-full h-full object-contain" /> : <FaImage size={32} className="text-gray-300" />}
                                </div>
                                <h3 className="text-[#2c2c2c] text-sm font-medium truncate">{relatedProduct.name}</h3>
                                <p className="text-[#2c2c2c] text-sm font-semibold mt-1">JD {(relatedProduct.discount ? relatedProduct.price - (relatedProduct.price * (relatedProduct.discount || 0) / 100) : relatedProduct.price).toFixed(2)}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200">
                <Ratings productId={product.id} />
            </div>
        </div>
    );
}