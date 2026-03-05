import { MetadataRoute } from 'next'
import { getAllProducts } from '@/app/lib/products'
import { getAllCategories } from '@/app/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://aurapeak.com'

    // الصفحات الثابتة
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/offers`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ]

    // صفحات المنتجات
    const products = await getAllProducts()
    const productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // صفحات التصنيفات
    const categories = await getAllCategories()
    const categoryPages = categories.map((category) => ({
        url: `${baseUrl}/products?category=${encodeURIComponent(category.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...categoryPages]
}