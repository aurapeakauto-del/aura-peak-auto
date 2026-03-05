// app/lib/theme.ts
// هذا الملف هو المصدر الوحيد لكل التصميمات في الموقع
// غير القيم هنا → يتغير الموقع كامل

export const theme = {
    // ============ الألوان ============
    colors: {
        // الخلفيات الرئيسية
        background: {
            primary: 'bg-black',
            secondary: 'bg-gray-900',
            accent: 'bg-white',
        },
        // النصوص
        text: {
            primary: 'text-white',
            secondary: 'text-gray-300',
            muted: 'text-gray-500',
            accent: 'text-black',
        },
        // الحدود
        border: {
            primary: 'border-gray-800',
            secondary: 'border-gray-700',
            accent: 'border-white',
        },
        // حالات hover
        hover: {
            bg: 'hover:bg-gray-900',
            border: 'hover:border-gray-600',
            text: 'hover:text-white',
        },
        // ألوان خاصة
        discount: 'bg-red-900/50 text-red-200',
        freeShipping: 'bg-gray-800 text-gray-300',
    },

    // ============ الخطوط والأحجام ============
    typography: {
        family: {
            sans: 'font-sans',
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            base: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl',
            '4xl': 'text-4xl',
        },
        weight: {
            light: 'font-light',
            normal: 'font-normal',
            medium: 'font-medium',
            bold: 'font-bold',
        },
    },

    // ============ المسافات والحاويات ============
    spacing: {
        container: 'container mx-auto px-4',
        section: 'py-8 md:py-12',
        card: 'p-4',
        button: 'px-6 py-3',
        input: 'px-4 py-3',
    },

    // ============ الأزرار ============
    button: {
        primary: 'bg-white text-black hover:bg-gray-200 transition-all duration-300',
        secondary: 'border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-all duration-300',
        outline: 'border border-gray-800 text-gray-400 hover:border-gray-600 transition-colors',
    },

    // ============ البطاقات ============
    card: {
        container: 'bg-black border border-gray-800 hover:border-gray-600 transition-all duration-300',
        image: 'bg-gray-900 aspect-square',
        title: 'text-white font-light hover:text-gray-300 transition-colors',
        price: 'text-white text-xl font-light',
    },

    // ============ التأثيرات ============
    animation: {
        transition: 'transition-all duration-300',
        hover: {
            scale: 'hover:scale-[1.02]',
            glow: 'hover:shadow-lg hover:shadow-white/5',
        }
    },

    // ============ النصوص الثابتة ============
    text: {
        siteName: 'Aura Peak Auto',
        siteTagline: 'إكسسوارات سيارات فاخرة',
        nav: {
            home: 'الرئيسية',
            products: 'المنتجات',
            offers: 'العروض',
            admin: 'لوحة التحكم',
        },
        cart: {
            title: 'سلة المشتريات',
            empty: 'السلة فارغة',
            total: 'الإجمالي',
            checkout: 'إتمام الشراء',
        },
        buttons: {
            addToCart: 'إضافة إلى السلة',
            viewProducts: 'المنتجات',
            viewOffers: 'العروض',
        }
    }
} as const;

// نوع الثيم للتوسع المستقبلي
export type Theme = typeof theme;