import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light text-[#2c2c2c] mb-4">404</h1>
        <h2 className="text-xl text-[#2c2c2c] mb-4">الصفحة غير موجودة</h2>
        <Link 
          href="/products" 
          className="px-6 py-3 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors"
        >
          العودة للمنتجات
        </Link>
      </div>
    </div>
  )
}