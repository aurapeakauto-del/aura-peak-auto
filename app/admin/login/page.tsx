'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                console.log('✅ تم تسجيل الدخول، جاري التوجيه...');

                // ✅ استخدام replace بدلاً من href
                window.location.replace('/admin');

                // ✅ تأكيد أن الكود وصل إلى هنا
                console.log('✅ تم تنفيذ window.location.replace');
            }
        } catch (err: any) {
            console.error('❌ خطأ:', err);
            setError(err.message || 'حدث خطأ في تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="bg-black border border-gray-800 p-8 w-96">
                <h1 className="text-2xl font-light mb-6 text-center">دخول المشرفين</h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-white text-sm transition-colors"
                    >
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
}