'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAdminLink, setShowAdminLink] = useState(false);

    // التحقق من وجود صلاحية الدخول
    useEffect(() => {
        const adminAccess = localStorage.getItem('auraAdmin');
        if (adminAccess === 'true') {
            setShowAdminLink(true);
        }
    }, []);

    // ✅ تم إزالة رابط "من نحن" من القائمة
    const navLinks = [
        { href: '/', label: 'الرئيسية' },
        { href: '/products', label: 'المنتجات' },
        { href: '/offers', label: 'العروض' },
        { href: '/products#best-sellers', label: 'الأكثر مبيعاً' },
        ...(showAdminLink ? [{ href: '/admin', label: 'لوحة التحكم' }] : []),
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="sticky top-0 z-30 bg-black border-b border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo - في أقصى اليمين */}
                    <Link
                        href="/"
                        className="text-white text-xl md:text-2xl font-light tracking-wider hover:text-gray-300 transition-colors"
                    >
                        Aura Peak <span className="text-gray-400">Auto</span>
                    </Link>

                    {/* Desktop Menu - في المنتصف (بدون "من نحن") */}
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

                    {/* زر القائمة للهواتف - في أقصى اليسار (بدون أيقونة السلة) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu - القائمة المنسدلة للهواتف (بدون "من نحن") */}
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
                    </div>
                </div>
            </div>
        </nav>
    );
}