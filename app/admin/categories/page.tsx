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

  // ✅ تحميل التصنيفات من Supabase
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    // تهيئة التصنيفات الافتراضية إذا كانت قاعدة البيانات فارغة
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
      // توليد slug تلقائياً من الاسم
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
      alert('الرجاء إدخال اسم التصنيف');
      return;
    }

    if (editingCategory) {
      // ✅ تعديل تصنيف موجود في Supabase
      const updated = await updateCategory(editingCategory.id, {
        name: formData.name,
        slug: formData.slug,
      });
      
      if (updated) {
        await loadCategories(); // إعادة تحميل القائمة
      }
    } else {
      // ✅ إضافة تصنيف جديد إلى Supabase
      const newCategory = await addCategory({
        name: formData.name,
        slug: formData.slug,
      });
      
      if (newCategory) {
        await loadCategories(); // إعادة تحميل القائمة
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

    // التحقق من وجود منتجات في هذا التصنيف
    if (categoryToDelete.productCount && categoryToDelete.productCount > 0) {
      alert(`لا يمكن حذف هذا التصنيف لأنه يحتوي على ${categoryToDelete.productCount} منتج. الرجاء نقل المنتجات إلى تصنيف آخر أولاً.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف التصنيف "${categoryToDelete.name}"؟`)) {
      // ✅ حذف من Supabase
      const success = await deleteCategory(id);
      if (success) {
        await loadCategories(); // إعادة تحميل القائمة
      }
    }
  };

  const handleResetToDefault = async () => {
    if (confirm('هل أنت متأكد من استعادة التصنيفات الافتراضية؟ سيتم حذف جميع التصنيفات المضافة حديثاً.')) {
      setLoading(true);
      
      // حذف جميع التصنيفات الموجودة
      for (const cat of categories) {
        await deleteCategory(cat.id);
      }
      
      // إضافة التصنيفات الافتراضية
      await initializeDefaultCategories();
      await loadCategories(); // إعادة تحميل القائمة
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="mt-4 text-gray-500">جاري تحميل التصنيفات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-wider">إدارة التصنيفات</h1>
            <p className="text-gray-500 mt-2">
              أضف، عدل، أو احذف تصنيفات المنتجات
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResetToDefault}
              className="px-6 py-3 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
            >
              استعادة الافتراضي
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {showForm ? 'إلغاء' : '+ إضافة تصنيف جديد'}
            </button>
          </div>
        </div>

        {/* نموذج إضافة/تعديل تصنيف */}
        {showForm && (
          <div className="bg-black border border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-light mb-6">
              {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="max-w-md">
              <div className="space-y-4">
                {/* اسم التصنيف */}
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
                    className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-white focus:outline-none transition-colors"
                    placeholder="مثال: كماليات خارجية"
                  />
                </div>

                {/* Slug (للـ URL) - للقراءة فقط */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    الرابط (Slug)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-gray-600 text-xs mt-1">
                    يتم توليد الرابط تلقائياً من اسم التصنيف
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف'}
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

        {/* جدول التصنيفات */}
        <div className="bg-black border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
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
                <tr key={category.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-white">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">{category.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={category.productCount && category.productCount > 0 ? 'text-white' : 'text-gray-600'}>
                      {category.productCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className={`transition-colors ${
                          category.productCount && category.productCount > 0
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-600 hover:text-red-500'
                        }`}
                        disabled={category.productCount ? category.productCount > 0 : false}
                      >
                        حذف
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
            className="text-gray-500 hover:text-white transition-colors"
          >
            ← العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}