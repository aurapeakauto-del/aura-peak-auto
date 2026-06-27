'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useToast } from './Toast';
import QuantityModal from './QuantityModal';
import { Product } from '@/app/lib/products';
import { FaTruck, FaStar, FaCheckCircle, FaImage, FaCartPlus } from 'react-icons/fa';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [showModal, setShowModal] = useState(false);

    const discountedPrice = product.discount
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    const isOutOfStock = product.stock === 0;

    const handleAddToCart = (quantity: number) => {
        addToCart(product, quantity);
        showToast(`تمت إضافة ${quantity} قطع من ${product.name} إلى السلة`, 'success');
        setShowModal(false);
    };

    return (
        <>
            <div className="bg-white border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-300 relative">
                {/* Discount Badge */}
                {product.discount && product.discount > 0 ? (
                    <div className="absolute top-2 left-2 z-20 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        -{product.discount}%
                    </div>
                ) : (
                    <div className="absolute top-2 left-2 z-20 text-xs px-2 py-1 opacity-0">0</div>
                )}

                {/* Free Shipping Badge */}
                {product.freeShipping && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
                        <FaTruck size={12} />
                        توصيل مجاني
                    </div>
                )}

                {/* Product Image with Link */}
                <Link href={`/products/${product.id}`} scroll={false} className="block relative w-full pt-[100%] bg-gray-50">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                quality={80}
                            />
                        ) : (
                            <FaImage size={48} className="text-gray-300" />
                        )}
                    </div>
                </Link>

                {/* Mobile Content */}
                <div className="block sm:hidden p-3">
                    <Link href={`/products/${product.id}`} scroll={false}>
                        <h3 className="text-[#1a1a1a] text-sm font-medium truncate mb-1">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                            <span className="text-[#1a1a1a] text-base font-semibold">JD {discountedPrice.toFixed(2)}</span>
                            {product.discount && (
                                <span className="text-gray-400 text-xs line-through">JD {product.price.toFixed(2)}</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{product.stock} قطعة</div>
                    </div>
                    {isOutOfStock ? (
                        <button disabled className="w-full py-2 bg-gray-200 text-gray-500 cursor-not-allowed rounded text-sm">
                            غير متوفر
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-2 bg-[#1a1a1a] text-white hover:bg-gray-800 rounded text-sm flex items-center justify-center gap-1"
                        >
                            <FaCartPlus size={14} />
                            إضافة للسلة
                        </button>
                    )}
                </div>

                {/* Desktop Content */}
                <div className="hidden sm:block p-4">
                    <Link href={`/products/${product.id}`} scroll={false}>
                        <h3 className="text-[#1a1a1a] font-medium text-base lg:text-lg mb-2 truncate">{product.name}</h3>
                    </Link>
                    <div className="mb-3 min-h-[2.5rem]">
                        <p className="text-gray-600 text-xs lg:text-sm line-clamp-2 overflow-hidden text-ellipsis">
                            {product.description}
                        </p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                            {product.discount ? (
                                <>
                                    <span className="text-[#1a1a1a] text-lg lg:text-xl font-semibold">
                                        JD {(product.price * (1 - product.discount / 100)).toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 text-xs line-through">JD {product.price.toFixed(2)}</span>
                                </>
                            ) : (
                                <span className="text-[#1a1a1a] text-lg lg:text-xl font-semibold">JD {product.price.toFixed(2)}</span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">{product.stock} قطعة</div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {product.featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <FaStar size={10} />
                                الأكثر طلباً
                            </span>
                        )}
                        {product.recommended && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <FaCheckCircle size={10} />
                                موصى به
                            </span>
                        )}
                    </div>

                    {isOutOfStock ? (
                        <button disabled className="w-full py-3 bg-gray-200 text-gray-500 border border-gray-200 cursor-not-allowed text-sm rounded">
                            غير متوفر
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-3 bg-[#1a1a1a] text-white hover:bg-gray-800 transition-colors text-sm font-medium rounded flex items-center justify-center gap-2"
                        >
                            <FaCartPlus size={16} />
                            إضافة للسلة
                        </button>
                    )}
                </div>
            </div>

            {showModal && (
                <QuantityModal product={product} onClose={() => setShowModal(false)} onAdd={handleAddToCart} />
            )}
        </>
    );
}