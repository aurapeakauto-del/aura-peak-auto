import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
    title: 'جميع المنتجات | إكسسوارات سيارات فاخرة - Aura Peak Auto',
    description: 'تصفح تشكيلتنا الكاملة من إكسسوارات السيارات الفاخرة.',
};

// ✅ مكون داخلي للـ Suspense
function ProductsPageContent() {
    return <ProductsClient />;
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2c2c2c] border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">جاري تحميل المنتجات...</p>
                </div>
            </div>
        }>
            <ProductsPageContent />
        </Suspense>
    );
}