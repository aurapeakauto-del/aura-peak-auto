import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
    title: 'جميع المنتجات | إكسسوارات سيارات فاخرة - Aura Peak Auto',
    description: 'تصفح تشكيلتنا الكاملة من إكسسوارات السيارات الفاخرة. كماليات داخلية، خارجية، إلكترونيات، عطور، وإضاءة.',
    keywords: 'منتجات سيارات, اكسسوارات سيارات, كماليات سيارات, عطور سيارات',
    openGraph: {
        title: 'جميع المنتجات | Aura Peak Auto',
        description: 'أفضل إكسسوارات السيارات الفاخرة في الأردن',
        url: 'https://aurapeak.com/products',
    },
}

export default function ProductsPage() {
    return <ProductsClient />
}