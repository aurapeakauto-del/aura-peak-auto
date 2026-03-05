'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

        console.log('1️⃣ محاولة تسجيل الدخول بـ:', email); // ✅ تشخيص

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('2️⃣ نتيجة Supabase:', { data, error }); // ✅ تشخيص

            if (error) {
                throw error;
            }

            if (data?.session) {
                console.log('3️⃣ تم إنشاء جلسة:', data.session); // ✅ تشخيص

                // ✅ التأكد من وجود session قبل التوجيه
                router.push('/admin');
                router.refresh();
            } else {
                console.log('4️⃣ لا توجد جلسة في البيانات'); // ✅ تشخيص
                setError('حدث خطأ غير متوقع');
            }
        } catch (err: any) {
            console.error('5️⃣ خطأ:', err); // ✅ تشخيص
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
                            placeholder="admin@example.com"
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
                            placeholder="••••••••"
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