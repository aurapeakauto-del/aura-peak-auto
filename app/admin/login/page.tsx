'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock, FaSignInAlt, FaSpinner, FaArrowRight } from 'react-icons/fa';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data?.session) {
                router.replace('/admin');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials'
                ? 'بيانات الدخول غير صحيحة'
                : err.message || 'حدث خطأ في تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="bg-black border border-gray-800 p-8 w-full max-w-md rounded-xl shadow-2xl">
                {/* الشعار والعنوان */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaLock className="text-3xl text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-light tracking-wider">دخول المشرفين</h1>
                    <p className="text-gray-500 text-sm mt-2">لوحة تحكم Aura Peak Auto</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* البريد الإلكتروني */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                        <div className="relative">
                            <FaUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pr-10 pl-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg transition-colors"
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>

                    {/* كلمة المرور */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">كلمة المرور</label>
                        <div className="relative">
                            <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pr-10 pl-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* رسالة الخطأ */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* زر تسجيل الدخول */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                جاري تسجيل الدخول...
                            </>
                        ) : (
                            <>
                                <FaSignInAlt />
                                تسجيل الدخول
                            </>
                        )}
                    </button>
                </form>

                {/* رابط العودة للرئيسية */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                    >
                        <FaArrowRight />
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
}