'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProductById } from '@/app/lib/products';

export interface CartItem {
    id: number;
    name: string;
    price: number;        // السعر النهائي للقطعة الواحدة (بعد الخصم + السعر الإضافي)
    originalPrice: number; // السعر الأصلي قبل أي إضافات
    extraPrice: number;   // السعر الإضافي للخيار المختار (0 إذا لا يوجد)
    image: string;
    quantity: number;
    discount?: number;
    freeShipping?: boolean;
    variant?: string;
    variantName?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity: number, variant?: string, extraPrice?: number) => void;
    addMultipleToCart: (product: any, variants: { variant: string; quantity: number; extraPrice?: number }[]) => void;
    removeFromCart: (productId: number, variant?: string) => void;
    updateQuantity: (productId: number, quantity: number, variant?: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    showCheckout: boolean;
    openCheckout: () => void;
    closeCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('auraCart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('خطأ في تحميل السلة');
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('auraCart', JSON.stringify(items));
    }, [items]);

    const getProductStock = async (productId: number): Promise<number> => {
        try {
            const product = await getProductById(productId);
            return product?.stock ?? 0;
        } catch (error) {
            console.error('خطأ في جلب المخزون:', error);
            return 0;
        }
    };

    // ✅ حساب السعر النهائي
    const calculateFinalPrice = (product: any, extraPrice: number = 0): number => {
        const discountedPrice = product.discount
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        return discountedPrice + extraPrice;
    };

    const addToCart = async (product: any, quantity: number, variant?: string, extraPrice: number = 0) => {
        const currentStock = await getProductStock(product.id);

        if (currentStock < quantity) {
            alert(`عذراً، الكمية المتوفرة من ${product.name} هي ${currentStock} قطع فقط`);
            return;
        }

        const displayName = variant
            ? `${product.name} - ${variant}`
            : product.name;

        const finalPrice = calculateFinalPrice(product, extraPrice);
        const originalPrice = product.price;

        setItems(prev => {
            const existing = prev.find(item =>
                variant
                    ? item.id === product.id && item.variant === variant
                    : item.id === product.id && !item.variant
            );

            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (currentStock < newQuantity) {
                    alert(`عذراً، لا يمكن إضافة هذه الكمية. المتوفر: ${currentStock} قطع`);
                    return prev;
                }

                return prev.map(item =>
                    (variant
                        ? item.id === product.id && item.variant === variant
                        : item.id === product.id && !item.variant)
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }

            return [...prev, {
                id: product.id,
                name: displayName,
                price: finalPrice,
                originalPrice: originalPrice,
                extraPrice: extraPrice,
                image: product.image || '',
                quantity,
                discount: product.discount,
                freeShipping: product.freeShipping,
                variant: variant,
                variantName: product.variants?.[0]?.name
            }];
        });
    };

    const addMultipleToCart = async (product: any, variants: { variant: string; quantity: number; extraPrice?: number }[]) => {
        const selectedVariants = variants.filter(v => v.quantity > 0);

        if (selectedVariants.length === 0) {
            alert('الرجاء اختيار كمية واحدة على الأقل');
            return;
        }

        const totalQuantity = selectedVariants.reduce((sum, v) => sum + v.quantity, 0);
        const currentStock = await getProductStock(product.id);

        if (currentStock < totalQuantity) {
            alert(`عذراً، الكمية المتوفرة من ${product.name} هي ${currentStock} قطع فقط`);
            return;
        }

        selectedVariants.forEach(({ variant, quantity, extraPrice = 0 }) => {
            const displayName = `${product.name} - ${variant}`;
            const finalPrice = calculateFinalPrice(product, extraPrice);
            const originalPrice = product.price;

            setItems(prev => {
                const existing = prev.find(item =>
                    item.id === product.id && item.variant === variant
                );

                if (existing) {
                    return prev.map(item =>
                        item.id === product.id && item.variant === variant
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }

                return [...prev, {
                    id: product.id,
                    name: displayName,
                    price: finalPrice,
                    originalPrice: originalPrice,
                    extraPrice: extraPrice,
                    image: product.image || '',
                    quantity,
                    discount: product.discount,
                    freeShipping: product.freeShipping,
                    variant: variant,
                    variantName: product.variants?.[0]?.name
                }];
            });
        });
    };

    const removeFromCart = (productId: number, variant?: string) => {
        setItems(prev => prev.filter(item =>
            variant
                ? !(item.id === productId && item.variant === variant)
                : !(item.id === productId && !item.variant)
        ));
    };

    const updateQuantity = async (productId: number, quantity: number, variant?: string) => {
        if (quantity < 1) {
            removeFromCart(productId, variant);
            return;
        }

        const availableStock = await getProductStock(productId);

        if (quantity > availableStock) {
            alert(`عذراً، الكمية المتوفرة من هذا المنتج هي ${availableStock} قطع فقط`);
            return;
        }

        setItems(prev =>
            prev.map(item =>
                (variant
                    ? item.id === productId && item.variant === variant
                    : item.id === productId && !item.variant)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const openCart = () => {
        setShowCheckout(false);
        setIsOpen(true);
    };

    const closeCart = () => setIsOpen(false);

    const toggleCart = () => {
        setShowCheckout(false);
        setIsOpen(!isOpen);
    };

    const openCheckout = () => {
        setIsOpen(false);
        setShowCheckout(true);
    };

    const closeCheckout = () => {
        setShowCheckout(false);
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            addMultipleToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice,
            isOpen,
            openCart,
            closeCart,
            toggleCart,
            showCheckout,
            openCheckout,
            closeCheckout,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}