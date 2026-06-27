'use client';

import { useState, useEffect } from 'react';
import {
    getCategoriesWithCounts,
    addCategory,
    updateCategory,
    deleteCategory,
    initializeDefaultCategories,
    Category
} from '@/app/lib/categories';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import {
    FaTags, FaPlus, FaEdit, FaTrash, FaSave, FaTimes,
    FaSpinner, FaArrowRight, FaUndo, FaBox, FaLink
} from 'react-icons/fa';

export default function CategoriesAdminPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        name: '',
        slug: '',
    });
    const { showToast } = useToast();

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        setLoading(true);
        await initializeDefaultCategories();
        const data = await getCategoriesWithCounts();
        setCategories(data);
        setLoading(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-') } : {})
        }));
    };

    const resetForm = () => {
        setFormData({ id: 0, name: '', slug: '' });
        setEditingCategory(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('الرجاء إدخال اسم التصنيف', 'warning');
            return;
        }

        if (editingCategory) {
            const updated = await updateCategory(editingCategory.id, {
                name: formData.name,
                slug: formData.slug,
            });
            if (updated) {
                showToast('تم تحديث التصنيف بنجاح', 'success');
                await loadCategories();
            } else {
                showToast('فشل تحديث التصنيف', 'error');
            }
        } else {
            const newCategory = await addCategory({
                name: formData.name,
                slug: formData.slug,
            });
            if (newCategory) {
                showToast('تم إضافة التصنيف بنجاح', 'success');
                await loadCategories();
            } else {
                showToast('فشل إضافة التصنيف', 'error');
            }
        }

        resetForm();
        setShowForm(false);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            id: category.id,
            name: category.name,
            slug: category.slug,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        if (categoryToDelete.productCount && categoryToDelete.productCount > 0) {
            showToast(`لا يمكن حذف التصنيف "${categoryToDelete.name}" لاحتوائه على ${categoryToDelete.productCount} منتج`, 'warning');
            return;
        }

        if (confirm(`هل أنت متأكد من حذف التصنيف "${categoryToDelete.name}"؟`)) {
            const success = await deleteCategory(id);
            if (success) {
                showToast('تم حذف التصنيف بنجاح', 'success');
                await loadCategories();
            } else {
                showToast('فشل حذف التصنيف', 'error');
            }
        }
    };

    const handleResetToDefault = async () => {
        if (confirm('هل أنت متأكد من استعادة التصنيفات الافتراضية؟ سيتم حذف جميع التصنيفات المضافة حديثاً.')) {
            setLoading(true);
            for (const cat of categories) {
                await deleteCategory(cat.id);
            }
            await initializeDefaultCategories();
            await loadCategories();
            setLoading(false);
            showToast('تمت استعادة التصنيفات الافتراضية', 'success');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="text-4xl animate-spin mx-auto mb-4 text-amber-500" />
                    <p className="text-gray-400">جاري تحميل التصنيفات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-wider flex items-center gap-3">
                            <FaTags className="text-amber-500" />
                            إدارة التصنيفات
                        </h1>
                        <p className="text-gray-500 mt-2">
                            أضف، عدل، أو احذف تصنيفات المنتجات
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleResetToDefault}
                            className="px-4 py-2.5 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors rounded-lg flex items-center gap-2"
                        >
                            <FaUndo /> استعادة الافتراضي
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowForm(!showForm);
                            }}
                            className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${showForm
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            {showForm ? <FaTimes /> : <FaPlus />}
                            {showForm ? 'إلغاء' : 'إضافة تصنيف جديد'}
                        </button>
                    </div>
                </div>

                {/* نموذج إضافة/تعديل تصنيف */}
                {showForm && (
                    <div className="bg-black border border-gray-800 p-6 rounded-lg mb-8">
                        <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                            <FaEdit className="text-amber-500" />
                            {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                        </h2>

                        <form onSubmit={handleSubmit} className="max-w-md">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">
                                        اسم التصنيف
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors rounded-lg"
                                        placeholder="مثال: كماليات خارجية"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2 flex items-center gap-1">
                                        <FaLink className="text-xs" /> الرابط (Slug)
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-gray-400 cursor-not-allowed rounded-lg"
                                    />
                                    <p className="text-gray-600 text-xs mt-1">
                                        يتم توليد الرابط تلقائياً من اسم التصنيف
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg flex items-center gap-2"
                                >
                                    <FaSave />
                                    {editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        setShowForm(false);
                                    }}
                                    className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors rounded-lg flex items-center gap-2"
                                >
                                    <FaTimes /> إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* جدول التصنيفات */}
                <div className="bg-black border border-gray-800 overflow-hidden rounded-lg">
                    <table className="w-full">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-right text-gray-400 font-light">#</th>
                                <th className="px-6 py-4 text-right text-gray-400 font-light">اسم التصنيف</th>
                                <th className="px-6 py-4 text-right text-gray-400 font-light">الرابط (Slug)</th>
                                <th className="px-6 py-4 text-right text-gray-400 font-light">عدد المنتجات</th>
                                <th className="px-6 py-4 text-right text-gray-400 font-light">التحكم</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {categories.map((category, index) => (
                                <tr key={category.id} className="hover:bg-gray-900/30 transition-colors">
                                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-white">{category.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-400 text-sm">{category.slug}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1 ${category.productCount && category.productCount > 0 ? 'text-white' : 'text-gray-600'}`}>
                                            <FaBox className="text-xs" />
                                            {category.productCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                            >
                                                <FaEdit /> تعديل
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className={`transition-colors flex items-center gap-1 ${category.productCount && category.productCount > 0
                                                        ? 'text-gray-700 cursor-not-allowed'
                                                        : 'text-red-500 hover:text-red-400'
                                                    }`}
                                                disabled={category.productCount ? category.productCount > 0 : false}
                                            >
                                                <FaTrash /> حذف
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* رابط العودة */}
                <div className="mt-8 text-center">
                    <Link
                        href="/admin"
                        className="text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                        <FaArrowRight /> العودة إلى لوحة التحكم
                    </Link>
                </div>
            </div>
        </div>
    );
}