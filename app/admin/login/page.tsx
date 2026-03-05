// app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // محاولة تسجيل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      if (data.session) {
        // تحقق إذا كان المستخدم مشرفاً (يمكنك إضافة شرط بريد إلكتروني محدد)
        if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          router.push('/admin')
          router.refresh()
        } else {
          setError('هذا البريد غير مصرح له بالدخول إلى لوحة التحكم')
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      setError(error.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* اللوقو */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Aura Peak Auto</h1>
          <p className="text-gray-600 mt-2">لوحة تحكم المشرفين</p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* نموذج الدخول */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="admin@aurapeak.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="••••••••"
              required
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* روابط مساعدة */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>هذه الصفحة خاصة بالمشرفين فقط</p>
          <Link href="/" className="text-black hover:underline mt-2 inline-block">
            العودة للمتجر
          </Link>
        </div>
      </div>
    </div>
  )
}