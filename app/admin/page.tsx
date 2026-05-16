'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, getAllProducts, addProduct, updateProduct, deleteProduct, Variant, VehicleFitment, getTotalStockFromVariants, getTotalStockFromVehicleFitments } from '@/app/lib/products';
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
    const [filteredProductList, setFilteredProductList] = useState<Product[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ✅ جديد: حالة البحث
    const [searchQuery, setSearchQuery] = useState('');

    // ✅ جديد: قائمة منسدلة للمنتجات المشابهة
    const [relatedDropdownOpen, setRelatedDropdownOpen] = useState(false);
    const [relatedSearch, setRelatedSearch] = useState('');
    const relatedDropdownRef = useRef<HTMLDivElement>(null);

    const { showToast } = useToast();
    const router = useRouter();

    // ✅ جديد: مرجع للنموذج للتمرير إليه
    const formRef = useRef<HTMLDivElement>(null);

    // ============ دوال المتغيرات ============
    const [variants, setVariants] = useState<Variant[]>([]);

    const addNewVariant = () => {
        setVariants([
            ...variants,
            {
                id: Date.now().toString(),
                name: '',
                options: []
            }
        ]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariantName = (index: number, name: string) => {
        const newVariants = [...variants];
        newVariants[index].name = name;
        setVariants(newVariants);
    };

    const addOptionToVariant = (variantIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options.push({
            name: '',
            stock: 0,
            extraPrice: 0
        });
        setVariants(newVariants);
    };

    const removeOptionFromVariant = (variantIndex: number, optionIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options = newVariants[variantIndex].options.filter((_, i) => i !== optionIndex);
        setVariants(newVariants);
    };

    const updateOptionName = (variantIndex: number, optionIndex: number, name: string) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options[optionIndex].name = name;
        setVariants(newVariants);
    };

    const updateOptionStock = (variantIndex: number, optionIndex: number, stock: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options[optionIndex].stock = stock;
        setVariants(newVariants);
    };

    const updateOptionExtraPrice = (variantIndex: number, optionIndex: number, extraPrice: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options[optionIndex].extraPrice = extraPrice;
        setVariants(newVariants);
    };

    // ============ دوال توافق المركبات (Vehicle Fitments) ============
    const [vehicleFitments, setVehicleFitments] = useState<VehicleFitment[]>([]);

    const addVehicleFitment = () => {
        setVehicleFitments([
            ...vehicleFitments,
            {
                id: Date.now().toString(),
                make: '',
                model: '',
                year: new Date().getFullYear(),
                stock: 0,
                extraPrice: 0,
                image: ''
            }
        ]);
    };

    const removeVehicleFitment = (index: number) => {
        setVehicleFitments(vehicleFitments.filter((_, i) => i !== index));
    };

    const updateVehicleFitment = (index: number, field: keyof VehicleFitment, value: any) => {
        const newFitments = [...vehicleFitments];
        newFitments[index] = { ...newFitments[index], [field]: value };
        setVehicleFitments(newFitments);
    };

    // ============ باقي الحالات والدوال ============
    useEffect(() => {
        checkUser();
    }, []);

    // ✅ إغلاق القائمة المنسدلة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (relatedDropdownRef.current && !relatedDropdownRef.current.contains(event.target as Node)) {
                setRelatedDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
        setFilteredProductList(data);
        setProductsLoading(false);
    };

    // ✅ تصفية المنتجات بناءً على البحث
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProductList(productList);
            return;
        }
        const query = searchQuery.toLowerCase().trim();
        const filtered = productList.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.id.toString().includes(query) ||
            product.categories.some(cat => cat.toLowerCase().includes(query))
        );
        setFilteredProductList(filtered);
    }, [searchQuery, productList]);

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
        additionalImages: [] as string[],
        categories: [] as string[],
        description: '',
        costPrice: '',
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
            additionalImages: [] as string[],
            categories: [],
            description: '',
            costPrice: '',
            relatedProducts: '',
        });
        setVariants([]);
        setVehicleFitments([]);
        setEditingProduct(null);
        setShowAdvanced(false);
        setRelatedSearch('');
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

        const images = [formData.image, ...(formData.additionalImages || [])];
        const relatedProducts = formData.relatedProducts
            ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : undefined;

        const discountEndDate = calculateEndDate(formData.discountEndType, formData.discountEndDate, formData.discountDays);
        const freeShippingEndDate = calculateEndDate(formData.freeShippingEndType, formData.freeShippingEndDate, formData.freeShippingDays);

        // حساب المخزون الإجمالي من المتغيرات وتوافق المركبات
        const variantsStock = getTotalStockFromVariants(variants);
        const fitmentsStock = getTotalStockFromVehicleFitments(vehicleFitments);
        const totalStock = parseInt(formData.stock) + variantsStock + fitmentsStock;

        const productData: any = {
            name: formData.name,
            description: formData.description || '',
            price: parseFloat(formData.price),
            cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
            stock: totalStock,
            image: formData.image || '/images/placeholder.jpg',
            images: images.filter(img => img !== ''),
            categories: formData.categories,
            discount: formData.discount ? parseFloat(formData.discount) : undefined,
            discount_end_date: discountEndDate,
            freeShipping: formData.freeShipping,
            free_shipping_end_date: freeShippingEndDate,
            variants: variants,
            vehicle_fitments: vehicleFitments,
            relatedProducts: relatedProducts,
        };

        try {
            let result;
            if (editingProduct) {
                result = await updateProduct(editingProduct.id, productData);
                if (result) {
                    await loadProducts();
                    showToast('تم تحديث المنتج بنجاح', 'success');
                } else {
                    showToast('حدث خطأ في تحديث المنتج', 'error');
                }
            } else {
                result = await addProduct(productData);
                if (result) {
                    await loadProducts();
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
        const additionalImages = product.images && product.images.length > 1
            ? product.images.slice(1)
            : [];
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
            additionalImages: additionalImages,
            categories: product.categories || [],
            description: product.description || '',
            costPrice: product.cost_price?.toString() || '',
            relatedProducts: product.relatedProducts?.join('، ') || '',
        });
        setVariants(product.variants || []);
        setVehicleFitments(product.vehicleFitments || []);
        setShowForm(true);

        // ✅ التمرير إلى النموذج
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // ✅ دالة الحذف مع Toast بدلاً من confirm
    const handleDelete = async (id: number) => {
        // استخدام confirm مؤقتاً (لا يمكن استبداله بالكامل بـ Toast لأنه يحتاج رد المستخدم)
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

    // ✅ دالة إضافة منتج للـ relatedProducts من القائمة المنسدلة
    const addRelatedProduct = (productId: number) => {
        const currentIds = formData.relatedProducts
            ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [];

        if (!currentIds.includes(productId)) {
            const newIds = [...currentIds, productId];
            setFormData(prev => ({
                ...prev,
                relatedProducts: newIds.join('، ')
            }));
        }
        setRelatedDropdownOpen(false);
        setRelatedSearch('');
    };

    // المنتجات المتاحة للقائمة المنسدلة (غير الموجودة حالياً في relatedProducts)
    const currentRelatedIds = formData.relatedProducts
        ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

    const availableForRelated = productList.filter(
        p => !currentRelatedIds.includes(p.id) && p.name.toLowerCase().includes(relatedSearch.toLowerCase())
    );

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

                {/* ✅ شريط البحث في جدول المنتجات */}
                {!showForm && (
                    <div className="mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 بحث عن منتج (اسم، رقم، تصنيف)..."
                            className="w-full max-w-md px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm"
                        />
                    </div>
                )}

                {showForm && (
                    <div ref={formRef} className="bg-black border border-gray-800 p-4 sm:p-6 mb-8">
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
                                    <label className="block text-gray-400 text-sm mb-2">المخزون الأساسي</label>
                                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="أضف كميات المتغيرات أدناه" />
                                    <p className="text-gray-500 text-xs mt-1">سيتم إضافة كميات المتغيرات والتوافقات تلقائياً</p>
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
                                    {/* الصورة الرئيسية */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الصورة الرئيسية</label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="flex-1 px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm" placeholder="رابط الصورة" />
                                            <div className="sm:w-auto">
                                                <ImageUploader onUpload={(url) => { setFormData(prev => ({ ...prev, image: url })); showToast('تم رفع الصورة الرئيسية', 'success'); }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* صور إضافية */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">صور إضافية</label>

                                        <input
                                            type="text"
                                            name="additionalImagesText"
                                            value={formData.additionalImages.join(', ')}
                                            onChange={(e) => {
                                                const text = e.target.value;
                                                const imagesArray = text.split(',').map(s => s.trim()).filter(s => s);
                                                setFormData(prev => ({ ...prev, additionalImages: imagesArray }));
                                            }}
                                            className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm mb-2"
                                            placeholder="روابط مفصولة بفواصل"
                                        />

                                        <div className="mt-2">
                                            <label className="block text-gray-500 text-xs mb-1">أو ارفع صوراً إضافية</label>
                                            <ImageUploader onUpload={(url) => {
                                                const current = [...(formData.additionalImages || [])];
                                                current.push(url);
                                                setFormData(prev => ({ ...prev, additionalImages: current }));
                                                showToast('تمت إضافة الصورة', 'success');
                                            }} />
                                        </div>

                                        {formData.additionalImages && formData.additionalImages.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-gray-500 text-xs mb-2">الصور المضافة ({formData.additionalImages.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.additionalImages.map((img, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img
                                                                src={img.trim()}
                                                                alt={`صورة ${idx + 1}`}
                                                                className="w-16 h-16 object-cover rounded border border-gray-700"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = [...formData.additionalImages];
                                                                    newImages.splice(idx, 1);
                                                                    setFormData(prev => ({ ...prev, additionalImages: newImages }));
                                                                    showToast('تم حذف الصورة', 'info');
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* الوصف */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الوصف</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none"></textarea>
                                    </div>

                                    {/* التصنيفات */}
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

                                    {/* سعر التكلفة */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">سعر التكلفة (اختياري)</label>
                                        <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none" placeholder="لحساب الربح" />
                                    </div>

                                    {/* ===== قسم المتغيرات ===== */}
                                    <div className="border-t border-gray-800 pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-gray-400 text-sm">المتغيرات (ألوان، مقاسات، مواد)</label>
                                            <button type="button" onClick={addNewVariant} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors flex items-center gap-1">
                                                <span>+</span> إضافة متغير
                                            </button>
                                        </div>

                                        {variants.length === 0 && (
                                            <p className="text-gray-500 text-xs text-center py-4">لا توجد متغيرات. أضف متغيراً أولاً.</p>
                                        )}

                                        {variants.map((variant, vIdx) => (
                                            <div key={variant.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg mb-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex-1">
                                                        <input type="text" value={variant.name} onChange={(e) => updateVariantName(vIdx, e.target.value)} className="w-64 px-3 py-2 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="اسم المتغير (مثال: اللون، المقاس)" />
                                                    </div>
                                                    <button type="button" onClick={() => removeVariant(vIdx)} className="text-red-500 hover:text-red-400 transition-colors">🗑️ حذف المتغير</button>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-gray-400 text-xs">الخيارات والكميات</label>
                                                        <button type="button" onClick={() => addOptionToVariant(vIdx)} className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors flex items-center gap-1">
                                                            <span>+</span> إضافة خيار
                                                        </button>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="text-gray-500 text-xs">
                                                                    <th className="text-right py-1 px-2">الخيار</th>
                                                                    <th className="text-right py-1 px-2">الكمية</th>
                                                                    <th className="text-right py-1 px-2">سعر إضافي (JD)</th>
                                                                    <th className="text-right py-1 px-2"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {variant.options.map((opt, oIdx) => (
                                                                    <tr key={oIdx}>
                                                                        <td className="py-1 px-2">
                                                                            <input type="text" value={opt.name} onChange={(e) => updateOptionName(vIdx, oIdx, e.target.value)} className="w-24 px-2 py-1 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="أحمر" />
                                                                        </td>
                                                                        <td className="py-1 px-2">
                                                                            <input type="number" value={opt.stock} onChange={(e) => updateOptionStock(vIdx, oIdx, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="0" />
                                                                        </td>
                                                                        <td className="py-1 px-2">
                                                                            <input type="number" step="0.01" value={opt.extraPrice} onChange={(e) => updateOptionExtraPrice(vIdx, oIdx, parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="0.00" />
                                                                        </td>
                                                                        <td className="py-1 px-2">
                                                                            <button type="button" onClick={() => removeOptionFromVariant(vIdx, oIdx)} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-2 text-right text-gray-500 text-xs">
                                                        إجمالي كمية هذا المتغير: {variant.options.reduce((sum, opt) => sum + opt.stock, 0)} قطعة
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ===== قسم توافق المركبات ===== */}
                                    <div className="border-t border-gray-800 pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-gray-400 text-sm">توافق المركبات (حسب نوع السيارة)</label>
                                            <button type="button" onClick={addVehicleFitment} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors flex items-center gap-1">
                                                <span>+</span> إضافة توافق
                                            </button>
                                        </div>

                                        {vehicleFitments.length === 0 && (
                                            <p className="text-gray-500 text-xs text-center py-4">لا توجد توافقات. أضف توافقاً أولاً.</p>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-gray-500 text-xs">
                                                        <th className="text-right py-2 px-2">الماركة</th>
                                                        <th className="text-right py-2 px-2">الموديل</th>
                                                        <th className="text-right py-2 px-2">السنة</th>
                                                        <th className="text-right py-2 px-2">الكمية</th>
                                                        <th className="text-right py-2 px-2">سعر إضافي (JD)</th>
                                                        <th className="text-right py-2 px-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vehicleFitments.map((fitment, idx) => (
                                                        <tr key={fitment.id}>
                                                            <td className="py-2 px-2">
                                                                <input type="text" value={fitment.make} onChange={(e) => updateVehicleFitment(idx, 'make', e.target.value)} className="w-28 px-2 py-1.5 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="BMW" />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input type="text" value={fitment.model} onChange={(e) => updateVehicleFitment(idx, 'model', e.target.value)} className="w-28 px-2 py-1.5 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="X5" />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input type="number" value={fitment.year} onChange={(e) => updateVehicleFitment(idx, 'year', parseInt(e.target.value) || new Date().getFullYear())} className="w-24 px-2 py-1.5 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="2020" />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input type="number" value={fitment.stock} onChange={(e) => updateVehicleFitment(idx, 'stock', parseInt(e.target.value) || 0)} className="w-20 px-2 py-1.5 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="0" />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <input type="number" step="0.01" value={fitment.extraPrice} onChange={(e) => updateVehicleFitment(idx, 'extraPrice', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none text-sm rounded" placeholder="0.00" />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <button type="button" onClick={() => removeVehicleFitment(idx)} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-2 text-right text-gray-500 text-xs">
                                            إجمالي كمية التوافقات: {vehicleFitments.reduce((sum, f) => sum + f.stock, 0)} قطعة
                                        </div>
                                    </div>

                                    {/* ✅ منتجات مقترحة مع قائمة منسدلة */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">منتجات مقترحة</label>

                                        {/* عرض المنتجات المختارة */}
                                        {currentRelatedIds.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {currentRelatedIds.map((id) => {
                                                    const relatedProduct = productList.find(p => p.id === id);
                                                    return (
                                                        <span key={id} className="inline-flex items-center gap-1 bg-gray-800 px-2 py-1 text-sm">
                                                            #{id} {relatedProduct?.name?.substring(0, 20)}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newIds = currentRelatedIds.filter(rid => rid !== id);
                                                                    setFormData(prev => ({ ...prev, relatedProducts: newIds.join('، ') }));
                                                                }}
                                                                className="text-red-400 hover:text-red-300"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* القائمة المنسدلة */}
                                        <div className="relative" ref={relatedDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setRelatedDropdownOpen(!relatedDropdownOpen)}
                                                className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-left flex justify-between items-center"
                                            >
                                                <span className="text-gray-500">اختر منتجات مقترحة...</span>
                                                <span>{relatedDropdownOpen ? '▲' : '▼'}</span>
                                            </button>

                                            {relatedDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-black border border-gray-700 shadow-2xl max-h-60 overflow-y-auto">
                                                    <div className="p-2">
                                                        <input
                                                            type="text"
                                                            value={relatedSearch}
                                                            onChange={(e) => setRelatedSearch(e.target.value)}
                                                            placeholder="ابحث عن منتج..."
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white focus:border-white focus:outline-none text-sm mb-2"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    {availableForRelated.length === 0 ? (
                                                        <p className="text-gray-500 text-sm p-3 text-center">
                                                            {productList.length === 0 ? 'جاري تحميل المنتجات...' : 'لا توجد منتجات متاحة'}
                                                        </p>
                                                    ) : (
                                                        availableForRelated.slice(0, 20).map((product) => (
                                                            <button
                                                                key={product.id}
                                                                type="button"
                                                                onClick={() => addRelatedProduct(product.id)}
                                                                className="w-full text-right px-4 py-2 hover:bg-gray-800 transition-colors flex items-center justify-between"
                                                            >
                                                                <span>{product.name}</span>
                                                                <span className="text-gray-500 text-xs">#{product.id}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">اختر من القائمة أو أدخل أرقام المنتجات (IDs) مفصولة بفواصل.</p>
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
                    ) : filteredProductList.length === 0 ? (
                        <div className="text-center py-20"><p className="text-gray-500">
                            {searchQuery ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات بعد'}</p>
                        </div>
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
                                {filteredProductList.map((product) => (
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