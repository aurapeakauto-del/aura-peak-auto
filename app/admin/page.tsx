'use client';

import { useState, useEffect } from 'react';
import { Product, getAllProducts, addProduct, updateProduct, deleteProduct } from '@/app/lib/products';
import ImageUploader from '@/app/components/ImageUploader';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';


export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    const [productList, setProductList] = useState<Product[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { showToast } = useToast();
    const router = useRouter();
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        console.log('🔍 Admin page - Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Admin page - Session:', session ? 'موجودة' : 'غير موجودة');

        if (!session) {
            console.log('🔍 لا توجد جلسة، توجيه إلى login');
            window.location.replace('/admin/login');
        } else {
            setUserEmail(session.user.email || '');
            setIsAuthorized(true);
            setLoading(false);
            // تحميل البيانات بعد التأكد من الجلسة
            loadProducts();
            loadCategories();
        }
    };

    const loadProducts = async () => {
        setProductsLoading(true);
        const data = await getAllProducts();
        setProductList(data);
        setProductsLoading(false);
    };

    const loadCategories = async () => {
        const { getAllCategories } = await import('@/app/lib/categories');
        const cats = await getAllCategories();
        setAvailableCategories(cats.map(c => c.name));
    };
    // نموذج مبسط جداً
    const [formData, setFormData] = useState({
        id: 0,
        name: '',
        price: '',
        stock: '',
        discount: '',
        discountEndType: 'none',
        discountEndDate: '',
        discountDays: '',
        freeShipping: false,
        freeShippingEndType: 'none',
        freeShippingEndDate: '',
        freeShippingDays: '',
        image: '',
        additionalImages: '',
        categories: [] as string[],
        description: '',
        costPrice: '',
        hasVariants: false,
        variantName: '',
        variantOptions: '',
        relatedProducts: '',
    });
    // التحقق من الجلسة عند تحميل الصفحة
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/admin/login');
                return;
            }

            // تحقق إذا كان البريد مصرحاً به (اختياري)
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            if (adminEmail && session.user.email !== adminEmail) {
                await supabase.auth.signOut();
                router.push('/admin/login?error=unauthorized');
                return;
            }

            setUserEmail(session.user.email || '');
            setIsAuthorized(true);
        } catch (error) {
            console.error('خطأ في التحقق من المستخدم:', error);
            router.push('/admin/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            loadProducts();
            loadCategories();
        }
    }, [isAuthorized]);

    const loadProducts = async () => {
        setProductsLoading(true);
        const data = await getAllProducts();
        setProductList(data);
        setProductsLoading(false);
    };

    const loadCategories = async () => {
        const { getAllCategories } = await import('@/app/lib/categories');
        const cats = await getAllCategories();
        setAvailableCategories(cats.map(c => c.name));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            id: 0,
            name: '',
            price: '',
            stock: '',
            discount: '',
            discountEndType: 'none',
            discountEndDate: '',
            discountDays: '',
            freeShipping: false,
            freeShippingEndType: 'none',
            freeShippingEndDate: '',
            freeShippingDays: '',
            image: '',
            additionalImages: '',
            categories: [],
            description: '',
            costPrice: '',
            hasVariants: false,
            variantName: '',
            variantOptions: '',
            relatedProducts: '',
        });
        setEditingProduct(null);
        setShowAdvanced(false);
    };

    // حساب تاريخ انتهاء الخصم
    const calculateEndDate = (type: string, dateValue: string, daysValue: string) => {
        if (type === 'date' && dateValue) {
            return dateValue;
        } else if (type === 'days' && daysValue) {
            const days = parseInt(daysValue);
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        } else if (type === 'weekend') {
            const date = new Date();
            const day = date.getDay();
            const daysUntilFriday = (5 - day + 7) % 7;
            date.setDate(date.getDate() + daysUntilFriday);
            return date.toISOString().split('T')[0];
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const images = [formData.image];
        if (formData.additionalImages) {
            const additional = formData.additionalImages.split(',').map(img => img.trim());
            images.push(...additional);
        }

        const variants = formData.hasVariants && formData.variantName && formData.variantOptions
            ? [{
                name: formData.variantName,
                options: formData.variantOptions.split(',').map(opt => opt.trim())
            }]
            : undefined;

        const relatedProducts = formData.relatedProducts
            ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : undefined;

        // حساب تواريخ الانتهاء
        const discountEndDate = calculateEndDate(
            formData.discountEndType,
            formData.discountEndDate,
            formData.discountDays
        );

        const freeShippingEndDate = calculateEndDate(
            formData.freeShippingEndType,
            formData.freeShippingEndDate,
            formData.freeShippingDays
        );

        const productData: any = {
            name: formData.name,
            description: formData.description || '',
            price: parseFloat(formData.price),
            cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
            stock: parseInt(formData.stock) || 0,
            image: formData.image || '/images/placeholder.jpg',
            images: images.filter(img => img !== ''),
            categories: formData.categories,
            discount: formData.discount ? parseFloat(formData.discount) : undefined,
            discount_end_date: discountEndDate,
            freeShipping: formData.freeShipping,
            free_shipping_end_date: freeShippingEndDate,
            variants: variants,
            relatedProducts: relatedProducts,
        };

        try {
            if (editingProduct) {
                const updated = await updateProduct(editingProduct.id, productData);
                if (updated) {
                    setProductList(prev =>
                        prev.map(p => p.id === editingProduct.id ? updated : p)
                    );
                    showToast('تم تحديث المنتج بنجاح', 'success');
                } else {
                    showToast('حدث خطأ في تحديث المنتج', 'error');
                }
            } else {
                const newProduct = await addProduct(productData);
                if (newProduct) {
                    setProductList(prev => [...prev, newProduct]);
                    showToast('تم إضافة المنتج بنجاح', 'success');
                } else {
                    showToast('حدث خطأ في إضافة المنتج', 'error');
                }
            }
        } catch (error) {
            showToast('حدث خطأ في حفظ المنتج', 'error');
        }

        resetForm();
        setShowForm(false);
        setSaving(false);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            id: product.id,
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            discount: product.discount?.toString() || '',
            discountEndType: product.discount_end_date ? 'date' : 'none',
            discountEndDate: product.discount_end_date || '',
            discountDays: '',
            freeShipping: product.freeShipping || false,
            freeShippingEndType: product.free_shipping_end_date ? 'date' : 'none',
            freeShippingEndDate: product.free_shipping_end_date || '',
            freeShippingDays: '',
            image: product.image,
            additionalImages: product.images?.slice(1).join('، ') || '',
            categories: product.categories || [],
            description: product.description || '',
            costPrice: product.cost_price?.toString() || '',
            hasVariants: !!product.variants,
            variantName: product.variants?.[0]?.name || '',
            variantOptions: product.variants?.[0]?.options.join('، ') || '',
            relatedProducts: product.relatedProducts?.join('، ') || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            const success = await deleteProduct(id);
            if (success) {
                setProductList(prev => prev.filter(p => p.id !== id));
                showToast('تم حذف المنتج بنجاح', 'success');
            } else {
                showToast('حدث خطأ في حذف المنتج', 'error');
            }
        }
    };

    // التحقق من العروض النشطة
    const isDiscountActive = (product: Product) => {
        if (!product.discount) return false;
        if (!product.discount_end_date) return true;
        return new Date(product.discount_end_date) >= new Date();
    };

    const isFreeShippingActive = (product: Product) => {
        if (!product.freeShipping) return false;
        if (!product.free_shipping_end_date) return true;
        return new Date(product.free_shipping_end_date) >= new Date();
    };

    // عرض شاشة التحميل
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري التحقق من صلاحيات الدخول...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // تم التحويل إلى صفحة login
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* الهيدر مع البريد الإلكتروني */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wider">لوحة التحكم</h1>
                        <p className="text-gray-500 mt-2">
                            مرحباً {userEmail} | إدارة المنتجات والمخزون
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                        >
                            تسجيل الخروج
                        </button>
                        <Link
                            href="/admin/categories"
                            className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                        >
                            التصنيفات
                        </Link>
                        <Link
                            href="/admin/reports"
                            className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                        >
                            التقارير
                        </Link>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowForm(!showForm);
                            }}
                            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors"
                            disabled={saving}
                        >
                            {showForm ? 'إلغاء' : '+ إضافة منتج'}
                        </button>
                    </div>
                </div>

                {/* نموذج إضافة/تعديل منتج - مبسط جداً */}
                {showForm && (
                    <div className="bg-black border border-gray-800 p-6 mb-8">
                        <h2 className="text-xl font-light mb-6">
                            {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* نفس محتوى النموذج السابق - بدون تغيير */}
                            {/* ===== القسم الأساسي (الأهم) ===== */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* الاسم */}
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">اسم المنتج</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* السعر */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">السعر (JD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* المخزون */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">الكمية المتوفرة</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* الخصم */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">نسبة الخصم (%)</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* نهاية الخصم */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">نهاية الخصم</label>
                                    <select
                                        name="discountEndType"
                                        value={formData.discountEndType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                    >
                                        <option value="none">بدون انتهاء</option>
                                        <option value="date">تاريخ محدد</option>
                                        <option value="days">بعد أيام</option>
                                        <option value="weekend">نهاية الأسبوع</option>
                                    </select>
                                </div>

                                {formData.discountEndType === 'date' && (
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">اختر التاريخ</label>
                                        <input
                                            type="date"
                                            name="discountEndDate"
                                            value={formData.discountEndDate}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {formData.discountEndType === 'days' && (
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">عدد الأيام</label>
                                        <input
                                            type="number"
                                            name="discountDays"
                                            value={formData.discountDays}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {/* توصيل مجاني */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="freeShipping"
                                        checked={formData.freeShipping}
                                        onChange={handleInputChange}
                                        className="w-5 h-5"
                                    />
                                    <label className="text-gray-400 text-sm">توصيل مجاني</label>
                                </div>

                                {/* نهاية التوصيل المجاني */}
                                {formData.freeShipping && (
                                    <>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2">نهاية التوصيل المجاني</label>
                                            <select
                                                name="freeShippingEndType"
                                                value={formData.freeShippingEndType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                            >
                                                <option value="none">بدون انتهاء</option>
                                                <option value="date">تاريخ محدد</option>
                                                <option value="days">بعد أيام</option>
                                                <option value="weekend">نهاية الأسبوع</option>
                                            </select>
                                        </div>

                                        {formData.freeShippingEndType === 'date' && (
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">اختر التاريخ</label>
                                                <input
                                                    type="date"
                                                    name="freeShippingEndDate"
                                                    value={formData.freeShippingEndDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                                />
                                            </div>
                                        )}

                                        {formData.freeShippingEndType === 'days' && (
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">عدد الأيام</label>
                                                <input
                                                    type="number"
                                                    name="freeShippingDays"
                                                    value={formData.freeShippingDays}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* ===== زر إظهار القسم المتقدم ===== */}
                            <div className="border-t border-gray-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <span>{showAdvanced ? '▼' : '▶'}</span>
                                    <span>{showAdvanced ? 'إخفاء الإعدادات الإضافية' : 'إظهار الإعدادات الإضافية'}</span>
                                </button>
                            </div>

                            {/* ===== القسم المتقدم ===== */}
                            {showAdvanced && (
                                <div className="space-y-4">
                                    {/* الصورة الرئيسية */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الصورة الرئيسية</label>
                                        <input
                                            type="text"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                            placeholder="رابط الصورة"
                                        />
                                        <div className="mt-2">
                                            <ImageUploader onUpload={(url) => {
                                                setFormData(prev => ({ ...prev, image: url }));
                                            }} />
                                        </div>
                                    </div>

                                    {/* صور إضافية */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">صور إضافية</label>
                                        <input
                                            type="text"
                                            name="additionalImages"
                                            value={formData.additionalImages}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                            placeholder="روابط مفصولة بفواصل"
                                        />
                                    </div>

                                    {/* الوصف */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الوصف</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* التصنيفات */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">التصنيفات</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-black border border-gray-800">
                                            {availableCategories.map((cat) => (
                                                <label key={cat} className="flex items-center gap-2 text-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        value={cat}
                                                        checked={formData.categories.includes(cat)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    categories: [...formData.categories, cat]
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    categories: formData.categories.filter(c => c !== cat)
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    {cat}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* سعر التكلفة */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">سعر التكلفة (اختياري)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="costPrice"
                                            value={formData.costPrice}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                            placeholder="لحساب الربح"
                                        />
                                    </div>

                                    {/* المتغيرات */}
                                    <div className="border-t border-gray-800 pt-4">
                                        <label className="flex items-center gap-2 text-gray-400 mb-4">
                                            <input
                                                type="checkbox"
                                                name="hasVariants"
                                                checked={formData.hasVariants}
                                                onChange={handleInputChange}
                                                className="w-4 h-4"
                                            />
                                            هذا المنتج له متغيرات (ألوان، مقاسات)
                                        </label>

                                        {formData.hasVariants && (
                                            <div className="space-y-4 mr-6">
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-2">اسم المتغير</label>
                                                    <input
                                                        type="text"
                                                        name="variantName"
                                                        value={formData.variantName}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                                        placeholder="مثال: اللون"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-2">الخيارات</label>
                                                    <input
                                                        type="text"
                                                        name="variantOptions"
                                                        value={formData.variantOptions}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                                        placeholder="مثال: أسود، أحمر، أزرق"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* منتجات مقترحة */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">منتجات مقترحة</label>
                                        <input
                                            type="text"
                                            name="relatedProducts"
                                            value={formData.relatedProducts}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                                            placeholder="أرقام المنتجات مفصولة بفواصل"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'جاري الحفظ...' : (editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        setShowForm(false);
                                    }}
                                    className="px-8 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* جدول المنتجات */}
                <div className="bg-black border border-gray-800 overflow-x-auto">
                    {productsLoading ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500">جاري تحميل المنتجات...</p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">المنتج</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">السعر</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">المخزون</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">الخصم</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">توصيل</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">التحكم</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {productList.map((product) => {
                                    const discountActive = isDiscountActive(product);
                                    const shippingActive = isFreeShippingActive(product);

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-white">{product.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.discount ? (
                                                    <div>
                                                        <span className="text-white">JD {(product.price - (product.price * product.discount / 100)).toFixed(2)}</span>
                                                        <span className="text-gray-500 text-xs line-through block">JD {product.price.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white">JD {product.price.toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={product.stock > 0 ? 'text-white' : 'text-red-500'}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.discount ? (
                                                    <div>
                                                        <span className="text-amber-500">{product.discount}%</span>
                                                        {!discountActive && product.discount_end_date && (
                                                            <span className="text-red-500 text-xs block">منتهي</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.freeShipping ? (
                                                    <div>
                                                        <span className="text-green-500">✓</span>
                                                        {!shippingActive && product.free_shipping_end_date && (
                                                            <span className="text-red-500 text-xs block">منتهي</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        تعديل
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="text-gray-600 hover:text-red-500 transition-colors"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}