'use client';

import { useCart } from '@/app/context/CartContext';
import { theme } from '@/app/lib/theme';
import CheckoutModal from './CheckoutModal';
import { FaTimes, FaMinus, FaPlus, FaShoppingCart, FaImage } from 'react-icons/fa';

export default function CartModal() {
    const {
        items,
        isOpen,
        closeCart,
        updateQuantity,
        removeFromCart,
        totalPrice,
        totalItems,
        showCheckout,
        openCheckout,
        closeCheckout
    } = useCart();

    if (showCheckout) {
        return <CheckoutModal onClose={closeCheckout} />;
    }

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={closeCart} />

            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#faf7f2] border border-gray-200 shadow-xl z-50 w-[95%] max-w-2xl max-h-[90vh] flex flex-col rounded-lg">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-[#2c2c2c] text-xl font-light flex items-center gap-2">
                        <FaShoppingCart className="text-gray-500" />
                        {theme.text.cart.title}
                        <span className="mr-2 text-sm text-gray-500">({totalItems})</span>
                    </h2>
                    <button onClick={closeCart} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <FaShoppingCart size={48} className="mb-3 text-gray-300" />
                            <p className="text-lg">{theme.text.cart.empty}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => {
                                const itemKey = item.variant ? `${item.id}-${item.variant}` : `${item.id}`;
                                return (
                                    <div key={itemKey} className="flex gap-4 bg-white p-3 border border-gray-200 rounded-lg">
                                        <div className="w-20 h-20 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 rounded flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                                            ) : (
                                                <FaImage size={24} className="text-gray-300" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[#2c2c2c] font-medium text-sm truncate">{item.name}</h3>
                                            <p className="text-gray-600 text-sm mt-1">JD {item.price.toFixed(2)}</p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)} className="w-7 h-7 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded">
                                                    <FaMinus size={10} />
                                                </button>
                                                <span className="text-[#2c2c2c] w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)} className="w-7 h-7 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded">
                                                    <FaPlus size={10} />
                                                </button>
                                            </div>
                                        </div>

                                        <button onClick={() => removeFromCart(item.id, item.variant)} className="text-gray-400 hover:text-red-500 transition-colors self-center flex-shrink-0">
                                            <FaTimes size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 p-6 bg-white rounded-b-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600 font-medium">{theme.text.cart.total}</span>
                            <span className="text-[#2c2c2c] text-xl font-semibold">JD {totalPrice.toFixed(2)}</span>
                        </div>
                        <button onClick={() => { console.log("💰 Checkout button clicked"); openCheckout(); }} className="w-full bg-[#2c2c2c] text-white py-4 hover:bg-gray-800 transition-colors text-lg tracking-wider font-medium rounded flex items-center justify-center gap-2">
                            <FaShoppingCart />
                            {theme.text.cart.checkout}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}