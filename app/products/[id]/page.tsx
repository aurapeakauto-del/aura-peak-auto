import { getProductById } from '@/app/lib/products'
import ProductDetailsClient from './ProductDetailsClient'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type tParams = Promise<{ id: string }>

export default async function ProductDetailsPage(props: { params: tParams }) {
  // ✅ الطريقة الصحيحة لـ Next.js 16
  const { id } = await props.params
  
  // ✅ تحويل id إلى رقم
  const productId = parseInt(id)
  
  // ✅ التحقق من صحة id
  if (isNaN(productId)) {
    notFound()
  }

  // ✅ التحقق من وجود المنتج
  const product = await getProductById(productId)
  
  if (!product) {
    notFound()
  }

  return <ProductDetailsClient id={productId} />
}