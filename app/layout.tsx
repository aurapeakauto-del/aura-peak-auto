import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/app/context/CartContext'
import { ToastProvider } from '@/app/components/Toast'
import Navbar from '@/app/components/Navbar'
import CartModal from '@/app/components/CartModal'
import FloatingCart from '@/app/components/FloatingCart'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aura Peak Auto | إكسسوارات سيارات فاخرة في الأردن',
  description: 'أفضل إكسسوارات السيارات الفاخرة في الأردن.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#2c2c2c" />
      </head>
      <body className={inter.className}>
        <CartProvider>
          <ToastProvider>
            <Navbar />
            <CartModal />
            <main>{children}</main>
            <FloatingCart />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  )
}