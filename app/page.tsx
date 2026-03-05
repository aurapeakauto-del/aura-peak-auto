'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function HomePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // خلفية متحركة - نجوم أكثر وضوحاً
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particles = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1.5,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.5 + 0.3,
            });
        }

        let animationFrame: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.y -= p.speed;
                if (p.y < 0) {
                    p.y = canvas.height;
                    p.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
            });

            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        setTimeout(() => {
            setSent(true);
            setSending(false);
            setFormData({ name: '', email: '', phone: '', message: '' });
            setTimeout(() => setSent(false), 5000);
        }, 1500);
    };

    return (
        <>
            {/* خلفية متحركة */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ background: '#faf7f2' }}
            />

            {/* المحتوى */}
            <div className="relative z-10 container mx-auto px-4">
                <div className="min-h-screen flex flex-col">

                    {/* Hero Section */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="mb-8 flex items-center justify-center">
                            <Image
                                src="/logos/logo.png"
                                alt="Aura Peak Auto"
                                width={320}
                                height={320}
                                className="w-auto h-auto max-w-[280px] md:max-w-[320px] object-contain"
                                priority
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-light mb-6 text-[#2c2c2c]">
                            Aura Peak <span className="text-gray-400">Auto</span>
                        </h1>

                        <p className="text-gray-500 mb-8 text-lg">
                            إكسسوارات سيارات فاخرة
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/products"
                                className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors min-w-[160px]"
                            >
                                المنتجات
                            </Link>
                            <Link
                                href="/offers"
                                className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors min-w-[160px]"
                            >
                                العروض
                            </Link>
                        </div>
                    </div>

                    {/* قسم من نحن */}
                    <div className="py-16 border-t border-gray-200">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-light mb-8 text-[#2c2c2c] text-center">
                                من نحن
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                                        تأسست Aura Peak Auto في الأردن عام 2024 بهدف تقديم أفضل إكسسوارات السيارات الفاخرة.
                                        نحن نؤمن أن سيارتك ليست مجرد وسيلة نقل، بل هي جزء من هويتك وذوقك الشخصي.
                                    </p>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                        نقدم تشكيلة واسعة من المنتجات عالية الجودة التي تضفي لمسة من الأناقة والتميز على سيارتك.
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 mt-8">
                                        <div className="text-center">
                                            <p className="text-2xl font-light text-[#2c2c2c]">+500</p>
                                            <p className="text-gray-500 text-xs">منتج</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-light text-[#2c2c2c]">+1000</p>
                                            <p className="text-gray-500 text-xs">عميل</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-light text-[#2c2c2c]">+50</p>
                                            <p className="text-gray-500 text-xs">ماركة</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 border border-gray-200 text-center">
                                        <span className="text-2xl mb-2 block">✨</span>
                                        <h3 className="font-medium text-[#2c2c2c] text-sm">جودة عالية</h3>
                                        <p className="text-gray-500 text-xs">منتجات أصلية</p>
                                    </div>
                                    <div className="bg-white p-4 border border-gray-200 text-center">
                                        <span className="text-2xl mb-2 block">🚚</span>
                                        <h3 className="font-medium text-[#2c2c2c] text-sm">توصيل سريع</h3>
                                        <p className="text-gray-500 text-xs">لجميع الأردن</p>
                                    </div>
                                    <div className="bg-white p-4 border border-gray-200 text-center">
                                        <span className="text-2xl mb-2 block">💳</span>
                                        <h3 className="font-medium text-[#2c2c2c] text-sm">دفع آمن</h3>
                                        <p className="text-gray-500 text-xs">خيارات متعددة</p>
                                    </div>
                                    <div className="bg-white p-4 border border-gray-200 text-center">
                                        <span className="text-2xl mb-2 block">🤝</span>
                                        <h3 className="font-medium text-[#2c2c2c] text-sm">دعم فوري</h3>
                                        <p className="text-gray-500 text-xs">فريق متاح</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* قسم اتصل بنا */}
                    <div className="py-16 border-t border-gray-200">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-light mb-8 text-[#2c2c2c] text-center">
                                تواصل معنا
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 border border-gray-200 text-center">
                                    <span className="text-3xl mb-3 block">📍</span>
                                    <h3 className="font-medium text-[#2c2c2c] mb-2">العنوان</h3>
                                    <p className="text-gray-500 text-sm">عمان - الأردن</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-200 text-center">
                                    <span className="text-3xl mb-3 block">📞</span>
                                    <h3 className="font-medium text-[#2c2c2c] mb-2">الهاتف</h3>
                                    <p className="text-gray-500 text-sm">0798072373</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-200 text-center">
                                    <span className="text-3xl mb-3 block">✉️</span>
                                    <h3 className="font-medium text-[#2c2c2c] mb-2">البريد</h3>
                                    <p className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CONTACT_EMAIL}</p>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <h3 className="text-lg font-light text-[#2c2c2c] mb-6">تابعنا على مواقع التواصل</h3>
                                <div className="flex justify-center gap-6">
                                    {/* فيسبوك */}
                                    <a
                                        href="https://facebook.com/share/17cu7ptouV"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#1877f2] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
                                        title="فيسبوك"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                                        </svg>
                                    </a>

                                    {/* انستغرام */}
                                    <a
                                        href="https://www.instagram.com/aura_peak.auto"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#e4405f] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
                                        title="انستغرام"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                                        </svg>
                                    </a>

                                    {/* واتساب */}
                                    <a
                                        href="https://wa.me/962798072373"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#25d366] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
                                        title="واتساب"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.523 5.86L.053 23.353c-.097.377.213.736.597.64l5.493-1.463C7.878 22.446 9.874 23 12 23c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                                        </svg>
                                    </a>

                                    {/* ماسنجر */}
                                    <a
                                        href="https://m.me/892099713996082"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#0084ff] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
                                        title="ماسنجر"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.51 1.828 6.635 4.688 8.667v4.111l4.286-2.348c1.142.315 2.34.48 3.546.48 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm.561 15l-3.001-3.204L6.9 15 2.86 9.37 9.44 9.37 12.441 12.574 15.1 9.37 21.14 9.37 14.56 15h-3.999z" />
                                        </svg>
                                    </a>
                                </div>
                                <p className="text-gray-500 text-sm mt-6">
                                    يمكنك التواصل معنا مباشرة عبر أي من هذه المنصات
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="py-8 border-t border-gray-200 mt-8">
                        <div className="text-center text-gray-400 text-xs">
                            © {new Date().getFullYear()} Aura Peak Auto. جميع الحقوق محفوظة
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}