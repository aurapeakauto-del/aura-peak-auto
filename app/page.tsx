'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FaStar, FaGem, FaTruck, FaCreditCard, FaHeadset, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';

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

    // خلفية متحركة - نجوم
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

        interface Particle {
            x: number;
            y: number;
            radius: number;
            speed: number;
            opacity: number;
        }

        const particles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.4 + 0.2,
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
                ctx.fillStyle = `rgba(0, 0, 0, ${p.opacity})`;
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 md:py-24">
                        <div className="mb-8 flex items-center justify-center animate-fadeIn">
                            <Image
                                src="/logos/logo.png"
                                alt="Aura Peak Auto"
                                width={320}
                                height={320}
                                className="w-auto h-auto max-w-[240px] md:max-w-[300px] object-contain drop-shadow-lg"
                                priority
                            />
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-6 text-[#1a1a1a] tracking-wider">
                            Aura Peak <span className="text-gray-400 font-extralight">Auto</span>
                        </h1>

                        <p className="text-gray-500 mb-8 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                            وجهتك الأولى لإكسسوارات السيارات الفاخرة في الأردن. نقدم تشكيلة منتقاة من المنتجات عالية الجودة لتضفي على سيارتك لمسة من الأناقة والتميز.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/products"
                                className="px-8 py-3.5 bg-[#1a1a1a] text-white hover:bg-gray-800 transition-all duration-300 min-w-[180px] rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium tracking-wide"
                            >
                                تصفح المنتجات
                            </Link>
                            <Link
                                href="/offers"
                                className="px-8 py-3.5 border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 min-w-[180px] rounded-lg font-medium tracking-wide"
                            >
                                العروض الحالية
                            </Link>
                        </div>

                        {/* شريط إحصائيات سريع */}
                        <div className="grid grid-cols-3 gap-8 md:gap-16 mt-16 md:mt-20">
                            <div className="text-center">
                                <p className="text-3xl md:text-4xl font-light text-[#1a1a1a]">+150</p>
                                <p className="text-gray-500 text-sm mt-1">منتج مميز</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl md:text-4xl font-light text-[#1a1a1a]">+400</p>
                                <p className="text-gray-500 text-sm mt-1">عميل سعيد</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl md:text-4xl font-light text-[#1a1a1a]">+20</p>
                                <p className="text-gray-500 text-sm mt-1">ماركة عالمية</p>
                            </div>
                        </div>
                    </div>

                    {/* قسم من نحن */}
                    <div className="py-16 md:py-20 border-t border-gray-200">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-light mb-4 text-[#1a1a1a] text-center tracking-wide">
                                من نحن
                            </h2>
                            <div className="w-16 h-0.5 bg-[#1a1a1a] mx-auto mb-12 opacity-20"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <p className="text-gray-600 text-base leading-relaxed">
                                        تأسست <span className="font-semibold text-[#1a1a1a]">Aura Peak Auto</span> في الأردن لتكون الوجهة الأولى لعشاق السيارات الذين يبحثون عن التميز والجودة. نؤمن بأن سيارتك هي امتداد لشخصيتك، ولذلك نقدم لك مجموعة منتقاة بعناية من أفخر إكسسوارات السيارات.
                                    </p>
                                    <p className="text-gray-600 text-base leading-relaxed">
                                        من الكماليات الداخلية الفاخرة إلى الإلكترونيات المتطورة والعطور الفريدة، نوفر كل ما تحتاجه لتجعل من سيارتك تجربة استثنائية. فريقنا ملتزم بتقديم أفضل خدمة عملاء وجودة لا تُضاهى.
                                    </p>
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-2 text-[#1a1a1a] font-medium text-sm hover:text-gray-600 transition-colors"
                                    >
                                        اكتشف منتجاتنا <span>→</span>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300 group">
                                        <FaGem className="text-3xl mb-3 mx-auto text-[#1a1a1a] group-hover:scale-110 transition-transform" />
                                        <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">جودة عالية</h3>
                                        <p className="text-gray-500 text-xs">منتجات أصلية 100%</p>
                                    </div>
                                    <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300 group">
                                        <FaTruck className="text-3xl mb-3 mx-auto text-[#1a1a1a] group-hover:scale-110 transition-transform" />
                                        <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">توصيل سريع</h3>
                                        <p className="text-gray-500 text-xs">لكافة محافظات الأردن</p>
                                    </div>
                                    <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300 group">
                                        <FaCreditCard className="text-3xl mb-3 mx-auto text-[#1a1a1a] group-hover:scale-110 transition-transform" />
                                        <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">دفع آمن ومرن</h3>
                                        <p className="text-gray-500 text-xs">خيارات متعددة تناسبك</p>
                                    </div>
                                    <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300 group">
                                        <FaHeadset className="text-3xl mb-3 mx-auto text-[#1a1a1a] group-hover:scale-110 transition-transform" />
                                        <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">دعم فوري</h3>
                                        <p className="text-gray-500 text-xs">فريق متاح لخدمتك</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* قسم تواصل معنا */}
                    <div className="py-16 md:py-20 border-t border-gray-200">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-light mb-4 text-[#1a1a1a] text-center tracking-wide">
                                تواصل معنا
                            </h2>
                            <div className="w-16 h-0.5 bg-[#1a1a1a] mx-auto mb-12 opacity-20"></div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300">
                                    <FaMapMarkerAlt className="text-3xl mb-3 mx-auto text-[#1a1a1a]" />
                                    <h3 className="font-semibold text-[#1a1a1a] mb-2">العنوان</h3>
                                    <p className="text-gray-500 text-sm">عمان - الأردن</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300">
                                    <FaPhone className="text-3xl mb-3 mx-auto text-[#1a1a1a]" />
                                    <h3 className="font-semibold text-[#1a1a1a] mb-2">الهاتف</h3>
                                    <p className="text-gray-500 text-sm" dir="ltr">0798072373</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-100 rounded-xl text-center hover:shadow-md transition-all duration-300">
                                    <FaEnvelope className="text-3xl mb-3 mx-auto text-[#1a1a1a]" />
                                    <h3 className="font-semibold text-[#1a1a1a] mb-2">البريد الإلكتروني</h3>
                                    <p className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@aurapeak.com'}</p>
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-light text-[#1a1a1a] mb-6">تابعنا على مواقع التواصل الاجتماعي</h3>
                                <div className="flex justify-center gap-4">
                                    <a href="https://facebook.com/share/17cu7ptouV" target="_blank" rel="noopener noreferrer" className="bg-[#1877f2] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl hover:opacity-90 hover:scale-110 transition-all duration-300 shadow-md" title="فيسبوك">
                                        <FaFacebook />
                                    </a>
                                    <a href="https://www.instagram.com/aura_peak.auto" target="_blank" rel="noopener noreferrer" className="bg-[#e4405f] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl hover:opacity-90 hover:scale-110 transition-all duration-300 shadow-md" title="انستغرام">
                                        <FaInstagram />
                                    </a>
                                    <a href="https://wa.me/962798072373" target="_blank" rel="noopener noreferrer" className="bg-[#25d366] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl hover:opacity-90 hover:scale-110 transition-all duration-300 shadow-md" title="واتساب">
                                        <FaWhatsapp />
                                    </a>
                                    <a href="https://m.me/892099713996082" target="_blank" rel="noopener noreferrer" className="bg-[#0084ff] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl hover:opacity-90 hover:scale-110 transition-all duration-300 shadow-md" title="ماسنجر">
                                        <FaFacebookMessenger />
                                    </a>
                                </div>
                                <p className="text-gray-500 text-sm mt-6">
                                    يسعدنا تواصلك معنا عبر أي من هذه المنصات
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="py-8 border-t border-gray-200 mt-8">
                        <div className="text-center text-gray-400 text-sm">
                            © {new Date().getFullYear()} <span className="font-medium text-[#1a1a1a]">Aura Peak Auto</span>. جميع الحقوق محفوظة
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}