import { getProductById } from '@/app/lib/products';
import ProductDetailsClient from './ProductDetailsClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type PageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return {
            title: 'منتج غير صالح',
        };
    }

    const product = await getProductById(productId);

    if (!product) {
        return {
            title: 'المنتج غير موجود',
        };
    }

    return {
        title: `${product.name} | إكسسوارات سيارات فاخرة - Aura Peak Auto`,
        description: product.description.substring(0, 160),
        keywords: `${product.name}, ${product.categories?.join(', ')}, اكسسوارات سيارات`,
        openGraph: {
            title: product.name,
            description: product.description.substring(0, 160),
            images: product.image ? [product.image] : [],
        },
    };
}

export default async function ProductDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        notFound();
    }

    const product = await getProductById(productId);

    if (!product) {
        notFound();
    }

    return <ProductDetailsClient id={productId} />;
}