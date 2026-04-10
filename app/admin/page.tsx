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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.replace('/admin/login');
        } else {
            setUserEmail(session.user.email || '');
            setIsAuthorized(true);
            setLoading(false);
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

    const calculateEndDate = (type: string, dateValue: string, daysValue: string) => {
        if (type === 'date' && dateValue) return dateValue;
        if (type === 'days' && daysValue) {
            const days = parseInt(daysValue);
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        }
        if (type === 'weekend') {
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

        const discountEndDate = calculateEndDate(formData.discountEndType, formData.discountEndDate, formData.discountDays);
        const freeShippingEndDate = calculateEndDate(formData.freeShippingEndType, formData.freeShippingEndDate, formData.freeShippingDays);

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
                    setProductList(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
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

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wider">لوحة التحكم</h1>
                        <p className="text-gray-500 mt-2">مرحباً {userEmail} | إدارة المنتجات والمخزون</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleLogout} className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm">تسجيل الخروج</button>
                        <Link href="/admin/categories" className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm">التصنيفات</Link>
                        <Link href="/admin/reports" className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm">التقارير</Link>
                        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors text-sm" disabled={saving}>
                            {showForm ? 'إلغاء' : '+ إضافة منتج'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="bg-black border border-gray-800 p-4 sm:p-6 mb-8">
                        <h2 className="text-xl font-light mb-6">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">اسم المنتج</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">السعر (JD)</label>
                                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">الكمية المتوفرة</label>
                                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">نسبة الخصم (%)</label>
                                    <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">نهاية الخصم</label>
                                    <select name="discountEndType" value={formData.discountEndType} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none">
                                        <option value="none">بدون انتهاء</option>
                                        <option value="date">تاريخ محدد</option>
                                        <option value="days">بعد أيام</option>
                                        <option value="weekend">نهاية الأسبوع</option>
                                    </select>
                                </div>
                                {formData.discountEndType === 'date' && (
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">اختر التاريخ</label>
                                        <input type="date" name="discountEndDate" value={formData.discountEndDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                    </div>
                                )}
                                {formData.discountEndType === 'days' && (
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">عدد الأيام</label>
                                        <input type="number" name="discountDays" value={formData.discountDays} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="freeShipping" checked={formData.freeShipping} onChange={handleInputChange} className="w-5 h-5" />
                                    <label className="text-gray-400 text-sm">توصيل مجاني</label>
                                </div>
                                {formData.freeShipping && (
                                    <>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2">نهاية التوصيل المجاني</label>
                                            <select name="freeShippingEndType" value={formData.freeShippingEndType} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none">
                                                <option value="none">بدون انتهاء</option>
                                                <option value="date">تاريخ محدد</option>
                                                <option value="days">بعد أيام</option>
                                                <option value="weekend">نهاية الأسبوع</option>
                                            </select>
                                        </div>
                                        {formData.freeShippingEndType === 'date' && (
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">اختر التاريخ</label>
                                                <input type="date" name="freeShippingEndDate" value={formData.freeShippingEndDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                            </div>
                                        )}
                                        {formData.freeShippingEndType === 'days' && (
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">عدد الأيام</label>
                                                <input type="number" name="freeShippingDays" value={formData.freeShippingDays} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="border-t border-gray-800 pt-4">
                                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                    <span>{showAdvanced ? '▼' : '▶'}</span>
                                    <span>{showAdvanced ? 'إخفاء الإعدادات الإضافية' : 'إظهار الإعدادات الإضافية'}</span>
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الصورة الرئيسية</label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="flex-1 px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm" placeholder="رابط الصورة" />
                                            <div className="sm:w-auto">
                                                <ImageUploader onUpload={(url) => { setFormData(prev => ({ ...prev, image: url })); showToast('تم رفع الصورة الرئيسية', 'success'); }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">صور إضافية</label>
                                        <input type="text" name="additionalImages" value={formData.additionalImages} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm mb-2" placeholder="روابط مفصولة بفواصل" />
                                        <div className="mt-2">
                                            <label className="block text-gray-500 text-xs mb-1">أو ارفع صوراً إضافية</label>
                                            <ImageUploader onUpload={(url) => {
                                                const current = formData.additionalImages ? formData.additionalImages.split(',').map(s => s.trim()) : [];
                                                current.push(url);
                                                setFormData(prev => ({ ...prev, additionalImages: current.join(', ') }));
                                                showToast('تمت إضافة الصورة', 'success');
                                            }} />
                                        </div>
                                        {formData.additionalImages && (
                                            <div className="mt-3">
                                                <p className="text-gray-500 text-xs mb-2">الصور المضافة ({formData.additionalImages.split(',').length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.additionalImages.split(',').map((img, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img src={img.trim()} alt={`صورة ${idx + 1}`} className="w-16 h-16 object-cover rounded border border-gray-700" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }} />
                                                            <button type="button" onClick={() => {
                                                                const imgs = formData.additionalImages.split(',').map(s => s.trim());
                                                                imgs.splice(idx, 1);
                                                                setFormData(prev => ({ ...prev, additionalImages: imgs.join(', ') }));
                                                                showToast('تم حذف الصورة', 'info');
                                                            }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الوصف</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">التصنيفات</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black border border-gray-800">
                                            {availableCategories.map((cat) => (
                                                <label key={cat} className="flex items-center gap-2 text-gray-300">
                                                    <input type="checkbox" value={cat} checked={formData.categories.includes(cat)} onChange={(e) => {
                                                        if (e.target.checked) setFormData({ ...formData, categories: [...formData.categories, cat] });
                                                        else setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
                                                    }} className="w-4 h-4" />
                                                    {cat}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">سعر التكلفة (اختياري)</label>
                                        <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="لحساب الربح" />
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <label className="flex items-center gap-2 text-gray-400 mb-4">
                                            <input type="checkbox" name="hasVariants" checked={formData.hasVariants} onChange={handleInputChange} className="w-4 h-4" />
                                            هذا المنتج له متغيرات (ألوان، مقاسات)
                                        </label>
                                        {formData.hasVariants && (
                                            <div className="space-y-4 mr-6">
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-2">اسم المتغير</label>
                                                    <input type="text" name="variantName" value={formData.variantName} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="مثال: اللون" />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-2">الخيارات</label>
                                                    <input type="text" name="variantOptions" value={formData.variantOptions} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="مثال: أسود، أحمر، أزرق" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">منتجات مقترحة</label>
                                        <input type="text" name="relatedProducts" value={formData.relatedProducts} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="مثال: 2, 4, 6" />
                                        <p className="text-gray-500 text-xs mt-1">أدخل أرقام المنتجات (IDs) مفصولة بفواصل، يمكنك رؤية الأرقام في عمود "#" بالجدول أدناه.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button type="submit" disabled={saving} className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : (editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-8 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-black border border-gray-800 overflow-x-auto">
                    {productsLoading ? (
                        <div className="text-center py-20"><p className="text-gray-500">جاري تحميل المنتجات...</p></div>
                    ) : (
                        <table className="w-full min-w-[850px]">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">#</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">المنتج</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">السعر</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">المخزون</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">الخصم</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">توصيل</th>
                                    <th className="px-6 py-4 text-right text-gray-400 font-light">التحكم</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {productList.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4"><span className="text-amber-500 font-mono">#{product.id}</span></td>
                                        <td className="px-6 py-4"><p className="text-white">{product.name}</p></td>
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
                                        <td className="px-6 py-4"><span className={product.stock > 0 ? 'text-white' : 'text-red-500'}>{product.stock}</span></td>
                                        <td className="px-6 py-4">
                                            {product.discount ? (
                                                <div>
                                                    <span className="text-amber-500">{product.discount}%</span>
                                                    {!isDiscountActive(product) && product.discount_end_date && <span className="text-red-500 text-xs block">منتهي</span>}
                                                </div>
                                            ) : <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.freeShipping ? (
                                                <div>
                                                    <span className="text-green-500">✓</span>
                                                    {!isFreeShippingActive(product) && product.free_shipping_end_date && <span className="text-red-500 text-xs block">منتهي</span>}
                                                </div>
                                            ) : <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(product)} className="text-gray-400 hover:text-white transition-colors">تعديل</button>
                                                <button onClick={() => handleDelete(product.id)} className="text-gray-600 hover:text-red-500 transition-colors">حذف</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}