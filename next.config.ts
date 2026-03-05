/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    images: {
        remotePatterns: [
            // للنطاقات الآمنة (يفضل تحديدها بشكل صريح)
            {
                protocol: 'https',
                hostname: '**.facebook.com',
            },
            {
                protocol: 'https',
                hostname: '**.instagram.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com', // ✅ أضفنا هذا النطاق
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '**.unsplash.com',
            },
            // للاختبار فقط - يسمح بأي نطاق (يمكنك إزالته لاحقاً)
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
}

module.exports = nextConfig