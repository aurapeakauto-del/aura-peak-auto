'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import { FaShoppingCart, FaSearch, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { totalItems, openCart } = useCart();

    // التحقق من جلسة المشرف
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAdmin(!!session);
        };

        checkAdmin();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAdmin(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const navLinks = [
        { href: '/', label: 'الرئيسية' },
        { href: '/products', label: 'المنتجات' },
        { href: '/offers', label: 'العروض' },
        ...(isAdmin ? [{ href: '/admin', label: 'لوحة التحكم' }] : []),
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="sticky top-0 z-30 bg-black border-b border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-white text-xl md:text-2xl font-light tracking-wider hover:text-gray-300 transition-colors"
                    >
                        Aura Peak <span className="text-gray-400">Auto</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`
                                    text-sm lg:text-base tracking-wide transition-colors
                                    ${isActive(link.href)
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions: Search + Cart + Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        {/* Search Icon */}
                        <Link
                            href="/products"
                            className="text-gray-400 hover:text-white transition-colors hidden md:block"
                            title="بحث"
                        >
                            <FaSearch size={18} />
                        </Link>

                        {/* Cart Icon */}
                        <button
                            onClick={openCart}
                            className="text-gray-400 hover:text-white transition-colors relative"
                            title="السلة"
                        >
                            <FaShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`
                    md:hidden overflow-hidden transition-all duration-300 ease-in-out
                    ${isMenuOpen ? 'max-h-96 border-t border-gray-800' : 'max-h-0'}
                `}>
                    <div className="py-4 space-y-3 bg-black">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`
                                    block py-2 px-2 text-base transition-colors rounded
                                    ${isActive(link.href)
                                        ? 'text-white bg-gray-900'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                    }
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {/* Mobile Search Link */}
                        <Link
                            href="/products"
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-2 px-2 text-base text-gray-400 hover:text-white hover:bg-gray-900 transition-colors rounded md:hidden"
                        >
                            <FaSearch className="inline ml-2" />
                            بحث
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}