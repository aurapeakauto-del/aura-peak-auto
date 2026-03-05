import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
    title: 'جميع المنتجات | إكسسوارات سيارات فاخرة - Aura Peak Auto',
    description: 'تصفح تشكيلتنا الكاملة من إكسسوارات السيارات الفاخرة.',
};

export default function ProductsPage() {
    return <ProductsClient />
}