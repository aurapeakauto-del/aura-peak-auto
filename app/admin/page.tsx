'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Product, getAllProducts, addProduct, updateProduct, deleteProduct,
    Variant, VehicleFitment, getTotalStockFromVariants, getTotalStockFromVehicleFitments
} from '@/app/lib/products';
import ImageUploader from '@/app/components/ImageUploader';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaList, FaChartBar,
    FaSearch, FaSave, FaTimes, FaChevronDown, FaChevronUp,
    FaImage, FaBox, FaCar, FaTags, FaDollarSign, FaWarehouse,
    FaTruck, FaPercentage, FaLink
} from 'react-icons/fa';

// ==================== مكون مساعد: قسم قابل للطي ====================
function CollapsibleSection({
    title,
    icon,
    defaultOpen = false,
    children
}: {
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/50 hover:bg-gray-900 transition-colors text-right"
            >
                <span className="flex items-center gap-2 text-gray-300 font-medium text-sm">
                    {icon}
                    {title}
                </span>
                {open ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
            </button>
            {open && <div className="p-4 space-y-4 bg-black">{children}</div>}
        </div>
    );
}

// ==================== مكون AdminPage الرئيسي ====================
export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');

    const [productList, setProductList] = useState<Product[]>([]);
    const [filteredProductList, setFilteredProductList] = useState<Product[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [relatedDropdownOpen, setRelatedDropdownOpen] = useState(false);
    const [relatedSearch, setRelatedSearch] = useState('');
    const relatedDropdownRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const { showToast } = useToast();
    const router = useRouter();

    // -------- المتغيرات ----------
    const [variants, setVariants] = useState<Variant[]>([]);
    const addNewVariant = () => setVariants([...variants, { id: Date.now().toString(), name: '', options: [] }]);
    const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
    const updateVariantName = (i: number, name: string) => {
        const v = [...variants]; v[i].name = name; setVariants(v);
    };
    const addOptionToVariant = (vi: number) => {
        const v = [...variants]; v[vi].options.push({ name: '', stock: 0, extraPrice: 0 }); setVariants(v);
    };
    const removeOptionFromVariant = (vi: number, oi: number) => {
        const v = [...variants]; v[vi].options = v[vi].options.filter((_, i) => i !== oi); setVariants(v);
    };
    const updateOptionName = (vi: number, oi: number, name: string) => { const v = [...variants]; v[vi].options[oi].name = name; setVariants(v); };
    const updateOptionStock = (vi: number, oi: number, stock: number) => { const v = [...variants]; v[vi].options[oi].stock = stock; setVariants(v); };
    const updateOptionExtraPrice = (vi: number, oi: number, extraPrice: number) => { const v = [...variants]; v[vi].options[oi].extraPrice = extraPrice; setVariants(v); };

    // -------- توافقات المركبات ----------
    const [vehicleFitments, setVehicleFitments] = useState<VehicleFitment[]>([]);
    const addVehicleFitment = () => setVehicleFitments([...vehicleFitments, { id: Date.now().toString(), make: '', model: '', year: new Date().getFullYear(), stock: 0, extraPrice: 0, image: '' }]);
    const removeVehicleFitment = (i: number) => setVehicleFitments(vehicleFitments.filter((_, idx) => idx !== i));
    const updateVehicleFitment = (i: number, field: keyof VehicleFitment, value: any) => {
        const f = [...vehicleFitments]; f[i] = { ...f[i], [field]: value }; setVehicleFitments(f);
    };

    // -------- الصلاحية والبيانات ----------
    useEffect(() => { checkUser(); }, []);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (relatedDropdownRef.current && !relatedDropdownRef.current.contains(e.target as Node)) setRelatedDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.replace('/admin/login'); return; }
        setUserEmail(session.user.email || '');
        setIsAuthorized(true);
        setLoading(false);
        loadProducts();
        loadCategories();
    };

    const loadProducts = async () => {
        setProductsLoading(true);
        const data = await getAllProducts();
        setProductList(data);
        setFilteredProductList(data);
        setProductsLoading(false);
    };

    useEffect(() => {
        if (!searchQuery.trim()) setFilteredProductList(productList);
        else {
            const q = searchQuery.toLowerCase().trim();
            setFilteredProductList(productList.filter(p => p.name.toLowerCase().includes(q) || p.id.toString().includes(q) || p.categories.some(c => c.toLowerCase().includes(q))));
        }
    }, [searchQuery, productList]);

    const loadCategories = async () => {
        const { getAllCategories } = await import('@/app/lib/categories');
        const cats = await getAllCategories();
        setAvailableCategories(cats.map(c => c.name));
    };

    const [formData, setFormData] = useState({
        id: 0, name: '', price: '', stock: '', discount: '', discountEndType: 'none', discountEndDate: '', discountDays: '',
        freeShipping: false, freeShippingEndType: 'none', freeShippingEndDate: '', freeShippingDays: '',
        image: '', additionalImages: [] as string[], categories: [] as string[], description: '', costPrice: '', relatedProducts: '',
    });

    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/admin/login'); router.refresh(); };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const resetForm = () => {
        setFormData({ id: 0, name: '', price: '', stock: '', discount: '', discountEndType: 'none', discountEndDate: '', discountDays: '', freeShipping: false, freeShippingEndType: 'none', freeShippingEndDate: '', freeShippingDays: '', image: '', additionalImages: [], categories: [], description: '', costPrice: '', relatedProducts: '' });
        setVariants([]); setVehicleFitments([]); setEditingProduct(null); setRelatedSearch('');
    };

    const calculateEndDate = (type: string, dateValue: string, daysValue: string) => {
        if (type === 'date' && dateValue) return dateValue;
        if (type === 'days' && daysValue) { const d = new Date(); d.setDate(d.getDate() + parseInt(daysValue)); return d.toISOString().split('T')[0]; }
        if (type === 'weekend') { const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7)); return d.toISOString().split('T')[0]; }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const images = [formData.image, ...(formData.additionalImages || [])];
        const relatedProducts = formData.relatedProducts ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : undefined;
        const discountEndDate = calculateEndDate(formData.discountEndType, formData.discountEndDate, formData.discountDays);
        const freeShippingEndDate = calculateEndDate(formData.freeShippingEndType, formData.freeShippingEndDate, formData.freeShippingDays);
        const totalStock = parseInt(formData.stock) + getTotalStockFromVariants(variants) + getTotalStockFromVehicleFitments(vehicleFitments);
        const productData: any = {
            name: formData.name, description: formData.description || '', price: parseFloat(formData.price), cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
            stock: totalStock, image: formData.image || '/images/placeholder.jpg', images: images.filter(img => img), categories: formData.categories,
            discount: formData.discount ? parseFloat(formData.discount) : undefined, discount_end_date: discountEndDate,
            freeShipping: formData.freeShipping, free_shipping_end_date: freeShippingEndDate,
            variants, vehicle_fitments: vehicleFitments, relatedProducts,
        };
        try {
            const result = editingProduct ? await updateProduct(editingProduct.id, productData) : await addProduct(productData);
            if (result) { await loadProducts(); showToast(editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح', 'success'); }
            else showToast('حدث خطأ في الحفظ', 'error');
        } catch { showToast('حدث خطأ في حفظ المنتج', 'error'); }
        resetForm(); setActiveTab('list'); setSaving(false);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            id: product.id, name: product.name, price: product.price.toString(), stock: product.stock.toString(),
            discount: product.discount?.toString() || '', discountEndType: product.discount_end_date ? 'date' : 'none', discountEndDate: product.discount_end_date || '', discountDays: '',
            freeShipping: product.freeShipping || false, freeShippingEndType: product.free_shipping_end_date ? 'date' : 'none', freeShippingEndDate: product.free_shipping_end_date || '', freeShippingDays: '',
            image: product.image, additionalImages: product.images?.slice(1) || [], categories: product.categories || [], description: product.description || '',
            costPrice: product.cost_price?.toString() || '', relatedProducts: product.relatedProducts?.join('، ') || '',
        });
        setVariants(product.variants || []); setVehicleFitments(product.vehicleFitments || []);
        setActiveTab('form');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            if (await deleteProduct(id)) { setProductList(prev => prev.filter(p => p.id !== id)); showToast('تم حذف المنتج بنجاح', 'success'); }
            else showToast('حدث خطأ في حذف المنتج', 'error');
        }
    };

    const currentRelatedIds = formData.relatedProducts ? formData.relatedProducts.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    const availableForRelated = productList.filter(p => !currentRelatedIds.includes(p.id) && p.name.toLowerCase().includes(relatedSearch.toLowerCase()));
    const addRelatedProduct = (id: number) => {
        if (!currentRelatedIds.includes(id)) setFormData(prev => ({ ...prev, relatedProducts: [...currentRelatedIds, id].join('، ') }));
        setRelatedDropdownOpen(false); setRelatedSearch('');
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>;
    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wider flex items-center gap-3">
                            <FaBox className="text-amber-500" />
                            لوحة التحكم
                        </h1>
                        <p className="text-gray-500 mt-2">مرحباً {userEmail} | إدارة المنتجات والمخزون</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleLogout} className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm flex items-center gap-2 rounded-lg"><FaSignOutAlt /> تسجيل الخروج</button>
                        <Link href="/admin/categories" className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm flex items-center gap-2 rounded-lg"><FaList /> التصنيفات</Link>
                        <Link href="/admin/reports" className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm flex items-center gap-2 rounded-lg"><FaChartBar /> التقارير</Link>
                        <button
                            onClick={() => { if (activeTab === 'form') { resetForm(); setActiveTab('list'); } else { resetForm(); setActiveTab('form'); } }}
                            className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'form' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            {activeTab === 'form' ? <FaTimes /> : <FaPlus />}
                            {activeTab === 'form' ? 'إلغاء' : 'إضافة منتج'}
                        </button>
                    </div>
                </div>

                {/* تبويب قائمة المنتجات */}
                {activeTab === 'list' && (
                    <>
                        <div className="mb-6 relative">
                            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="بحث عن منتج (اسم، رقم، تصنيف)..."
                                className="w-full max-w-md pr-10 pl-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm rounded-lg"
                            />
                        </div>
                        <div className="bg-black border border-gray-800 overflow-x-auto rounded-lg">
                            {productsLoading ? (
                                <div className="text-center py-20"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /></div>
                            ) : filteredProductList.length === 0 ? (
                                <div className="text-center py-20"><p className="text-gray-500">{searchQuery ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات بعد'}</p></div>
                            ) : (
                                <table className="w-full min-w-[850px]">
                                    <thead className="bg-gray-900/50">
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
                                        {filteredProductList.map(product => (
                                            <tr key={product.id} className="hover:bg-gray-900/30 transition-colors">
                                                <td className="px-6 py-4"><span className="text-amber-500 font-mono">#{product.id}</span></td>
                                                <td className="px-6 py-4"><p className="text-white">{product.name}</p></td>
                                                <td className="px-6 py-4">
                                                    {product.discount ? (
                                                        <div><span className="text-white">JD {(product.price - (product.price * product.discount / 100)).toFixed(2)}</span><span className="text-gray-500 text-xs line-through block">JD {product.price.toFixed(2)}</span></div>
                                                    ) : <span className="text-white">JD {product.price.toFixed(2)}</span>}
                                                </td>
                                                <td className="px-6 py-4"><span className={product.stock > 0 ? 'text-white' : 'text-red-500'}>{product.stock}</span></td>
                                                <td className="px-6 py-4">
                                                    {product.discount ? <div><span className="text-amber-500">{product.discount}%</span>{product.discount_end_date && new Date(product.discount_end_date) < new Date() && <span className="text-red-500 text-xs block">منتهي</span>}</div> : <span className="text-gray-600">-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {product.freeShipping ? <div><span className="text-green-500">✓</span>{product.free_shipping_end_date && new Date(product.free_shipping_end_date) < new Date() && <span className="text-red-500 text-xs block">منتهي</span>}</div> : <span className="text-gray-600">-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEdit(product)} className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"><FaEdit /> تعديل</button>
                                                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"><FaTrash /> حذف</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* تبويب النموذج */}
                {activeTab === 'form' && (
                    <div ref={formRef} className="bg-black border border-gray-800 p-6 rounded-lg space-y-6">
                        <h2 className="text-xl font-light flex items-center gap-2">
                            <FaEdit className="text-amber-500" />
                            {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* قسم أساسي */}
                            <CollapsibleSection title="معلومات أساسية" icon={<FaBox />} defaultOpen>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-gray-400 text-sm mb-2">اسم المنتج *</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">السعر (JD) *</label>
                                        <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">المخزون الأساسي</label>
                                        <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" placeholder="أضف كميات المتغيرات أدناه" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">نسبة الخصم (%)</label>
                                        <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">نهاية الخصم</label>
                                        <select name="discountEndType" value={formData.discountEndType} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg">
                                            <option value="none">بدون انتهاء</option><option value="date">تاريخ محدد</option><option value="days">بعد أيام</option><option value="weekend">نهاية الأسبوع</option>
                                        </select>
                                    </div>
                                    {formData.discountEndType === 'date' && (
                                        <div><label className="block text-gray-400 text-sm mb-2">اختر التاريخ</label><input type="date" name="discountEndDate" value={formData.discountEndDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" /></div>
                                    )}
                                    {formData.discountEndType === 'days' && (
                                        <div><label className="block text-gray-400 text-sm mb-2">عدد الأيام</label><input type="number" name="discountDays" value={formData.discountDays} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" /></div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="freeShipping" checked={formData.freeShipping} onChange={handleInputChange} className="w-5 h-5" />
                                        <label className="text-gray-400 text-sm flex items-center gap-1"><FaTruck /> توصيل مجاني</label>
                                    </div>
                                    {formData.freeShipping && (<>
                                        <div><label className="block text-gray-400 text-sm mb-2">نهاية التوصيل المجاني</label><select name="freeShippingEndType" value={formData.freeShippingEndType} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg"><option value="none">بدون انتهاء</option><option value="date">تاريخ محدد</option><option value="days">بعد أيام</option><option value="weekend">نهاية الأسبوع</option></select></div>
                                        {formData.freeShippingEndType === 'date' && <div><label>اختر التاريخ</label><input type="date" name="freeShippingEndDate" value={formData.freeShippingEndDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" /></div>}
                                        {formData.freeShippingEndType === 'days' && <div><label>عدد الأيام</label><input type="number" name="freeShippingDays" value={formData.freeShippingDays} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" /></div>}
                                    </>)}
                                </div>
                            </CollapsibleSection>

                            {/* قسم متقدم (صور، وصف، تصنيفات) */}
                            <CollapsibleSection title="الصور والوصف والتصنيفات" icon={<FaImage />}>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">الصورة الرئيسية</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="flex-1 px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm rounded-lg" placeholder="رابط الصورة" />
                                        <ImageUploader onUpload={(url) => { setFormData(prev => ({ ...prev, image: url })); showToast('تم رفع الصورة الرئيسية', 'success'); }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">صور إضافية</label>
                                    <input type="text" value={formData.additionalImages.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, additionalImages: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none text-sm rounded-lg mb-2" placeholder="روابط مفصولة بفواصل" />
                                    <ImageUploader onUpload={(url) => { setFormData(prev => ({ ...prev, additionalImages: [...prev.additionalImages, url] })); showToast('تمت إضافة الصورة', 'success'); }} />
                                    {formData.additionalImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.additionalImages.map((img, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={img} className="w-16 h-16 object-cover rounded border border-gray-700" onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.jpg'} />
                                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"><FaTimes /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">الوصف</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">التصنيفات</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black border border-gray-800 rounded-lg">
                                        {availableCategories.map(cat => (
                                            <label key={cat} className="flex items-center gap-2 text-gray-300">
                                                <input type="checkbox" checked={formData.categories.includes(cat)} onChange={e => setFormData(prev => ({ ...prev, categories: e.target.checked ? [...prev.categories, cat] : prev.categories.filter(c => c !== cat) }))} className="w-4 h-4" />
                                                {cat}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">سعر التكلفة (اختياري)</label>
                                    <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none rounded-lg" placeholder="لحساب الربح" />
                                </div>
                            </CollapsibleSection>

                            {/* قسم المتغيرات */}
                            <CollapsibleSection title="المتغيرات (ألوان، مقاسات)" icon={<FaTags />}>
                                <button type="button" onClick={addNewVariant} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 flex items-center gap-1"><FaPlus /> إضافة متغير</button>
                                {variants.map((variant, vIdx) => (
                                    <div key={variant.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <input type="text" value={variant.name} onChange={e => updateVariantName(vIdx, e.target.value)} className="flex-1 px-3 py-2 bg-black border border-gray-700 text-white rounded-lg" placeholder="اسم المتغير (اللون، المقاس)" />
                                            <button type="button" onClick={() => removeVariant(vIdx)} className="text-red-400 hover:text-red-300 ml-2"><FaTrash /></button>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead><tr className="text-gray-500 text-xs"><th className="text-right py-1 px-2">الخيار</th><th className="text-right py-1 px-2">الكمية</th><th className="text-right py-1 px-2">سعر إضافي</th><th></th></tr></thead>
                                            <tbody>
                                                {variant.options.map((opt, oIdx) => (
                                                    <tr key={oIdx}>
                                                        <td className="py-1 px-2"><input type="text" value={opt.name} onChange={e => updateOptionName(vIdx, oIdx, e.target.value)} className="w-24 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                        <td className="py-1 px-2"><input type="number" value={opt.stock} onChange={e => updateOptionStock(vIdx, oIdx, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                        <td className="py-1 px-2"><input type="number" step="0.01" value={opt.extraPrice} onChange={e => updateOptionExtraPrice(vIdx, oIdx, parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                        <td className="py-1 px-2"><button type="button" onClick={() => removeOptionFromVariant(vIdx, oIdx)} className="text-red-400"><FaTimes /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button type="button" onClick={() => addOptionToVariant(vIdx)} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"><FaPlus /> إضافة خيار</button>
                                    </div>
                                ))}
                            </CollapsibleSection>

                            {/* قسم التوافقات */}
                            <CollapsibleSection title="توافق المركبات" icon={<FaCar />}>
                                <button type="button" onClick={addVehicleFitment} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 flex items-center gap-1"><FaPlus /> إضافة توافق</button>
                                <table className="w-full text-sm">
                                    <thead><tr className="text-gray-500 text-xs"><th className="text-right py-1 px-2">الماركة</th><th className="text-right py-1 px-2">الموديل</th><th className="text-right py-1 px-2">السنة</th><th className="text-right py-1 px-2">الكمية</th><th className="text-right py-1 px-2">سعر إضافي</th><th></th></tr></thead>
                                    <tbody>
                                        {vehicleFitments.map((f, idx) => (
                                            <tr key={f.id}>
                                                <td className="py-1 px-2"><input type="text" value={f.make} onChange={e => updateVehicleFitment(idx, 'make', e.target.value)} className="w-24 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                <td className="py-1 px-2"><input type="text" value={f.model} onChange={e => updateVehicleFitment(idx, 'model', e.target.value)} className="w-24 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                <td className="py-1 px-2"><input type="number" value={f.year} onChange={e => updateVehicleFitment(idx, 'year', parseInt(e.target.value) || new Date().getFullYear())} className="w-20 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                <td className="py-1 px-2"><input type="number" value={f.stock} onChange={e => updateVehicleFitment(idx, 'stock', parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                <td className="py-1 px-2"><input type="number" step="0.01" value={f.extraPrice} onChange={e => updateVehicleFitment(idx, 'extraPrice', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black border border-gray-700 rounded" /></td>
                                                <td className="py-1 px-2"><button type="button" onClick={() => removeVehicleFitment(idx)} className="text-red-400"><FaTrash /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CollapsibleSection>

                            {/* قسم منتجات مقترحة */}
                            <CollapsibleSection title="منتجات مقترحة" icon={<FaLink />}>
                                {currentRelatedIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {currentRelatedIds.map(id => {
                                            const rp = productList.find(p => p.id === id);
                                            return <span key={id} className="inline-flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-sm">#{id} {rp?.name?.substring(0, 20)} <button onClick={() => setFormData(prev => ({ ...prev, relatedProducts: currentRelatedIds.filter(rid => rid !== id).join('، ') }))} className="text-red-400"><FaTimes /></button></span>;
                                        })}
                                    </div>
                                )}
                                <div className="relative" ref={relatedDropdownRef}>
                                    <button type="button" onClick={() => setRelatedDropdownOpen(!relatedDropdownOpen)} className="w-full px-4 py-3 bg-black border border-gray-800 text-white flex justify-between items-center rounded-lg">
                                        <span className="text-gray-500">اختر منتجات مقترحة...</span>
                                        {relatedDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                    {relatedDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-black border border-gray-700 max-h-60 overflow-y-auto rounded-lg">
                                            <div className="p-2"><input type="text" value={relatedSearch} onChange={e => setRelatedSearch(e.target.value)} placeholder="ابحث عن منتج..." className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded" autoFocus /></div>
                                            {availableForRelated.length === 0 ? <p className="text-gray-500 text-sm p-3">لا توجد منتجات</p> :
                                                availableForRelated.slice(0, 20).map(p => (
                                                    <button key={p.id} type="button" onClick={() => addRelatedProduct(p.id)} className="w-full text-right px-4 py-2 hover:bg-gray-800 flex justify-between">
                                                        <span>{p.name}</span><span className="text-gray-500 text-xs">#{p.id}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </CollapsibleSection>

                            {/* أزرار الإجراءات */}
                            <div className="flex gap-3 pt-4 border-t border-gray-800">
                                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 font-medium">
                                    <FaSave /> {saving ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setActiveTab('list'); }} className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white rounded-lg flex items-center gap-2">
                                    <FaTimes /> إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}