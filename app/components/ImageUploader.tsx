'use client';

import { useState, useEffect } from 'react';
import { useToast } from './Toast';
import {
    FaCloudUploadAlt,
    FaImages,
    FaSearch,
    FaTimes,
    FaTrash
} from 'react-icons/fa';

interface ImageUploaderProps {
    onUpload: (url: string) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [savedImages, setSavedImages] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    // تحميل الصور المحفوظة من localStorage عند تحميل المكون
    useEffect(() => {
        const stored = localStorage.getItem('cloudinary_images');
        if (stored) {
            try {
                setSavedImages(JSON.parse(stored));
            } catch (e) {
                console.error('خطأ في تحميل الصور المحفوظة');
            }
        }
    }, []);

    // حفظ صورة جديدة في localStorage
    const saveImageToLibrary = (url: string) => {
        if (!savedImages.includes(url)) {
            const newImages = [url, ...savedImages];
            setSavedImages(newImages);
            localStorage.setItem('cloudinary_images', JSON.stringify(newImages));
        }
    };

    // رفع صورة جديدة
    const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'aura_peak_preset');

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await res.json();
            if (data.secure_url) {
                onUpload(data.secure_url);
                saveImageToLibrary(data.secure_url);
                showToast('تم رفع الصورة بنجاح', 'success');
            } else {
                throw new Error('فشل رفع الصورة');
            }
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            showToast('فشل رفع الصورة', 'error');
        } finally {
            setUploading(false);
        }
    };

    // اختيار صورة من المكتبة
    const selectFromLibrary = (url: string) => {
        onUpload(url);
        setShowLibrary(false);
        showToast('تم اختيار الصورة', 'success');
    };

    // حذف صورة من المكتبة
    const deleteFromLibrary = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newImages = savedImages.filter(img => img !== url);
        setSavedImages(newImages);
        localStorage.setItem('cloudinary_images', JSON.stringify(newImages));
        showToast('تم حذف الصورة من المكتبة', 'info');
    };

    // تصفية الصور حسب البحث
    const filteredImages = savedImages.filter(img =>
        img.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mt-2">
            {/* أزرار الرفع */}
            <div className="flex flex-wrap gap-2">
                <label className={`cursor-pointer bg-[#2c2c2c] text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors rounded-lg flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploading ? (
                        <>
                            <FaCloudUploadAlt className="animate-pulse" />
                            جاري الرفع...
                        </>
                    ) : (
                        <>
                            <FaCloudUploadAlt />
                            رفع صورة جديدة
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={uploadImage}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>

                <button
                    type="button"
                    onClick={() => setShowLibrary(true)}
                    className="bg-gray-700 text-white px-4 py-2 text-sm hover:bg-gray-600 transition-colors rounded-lg flex items-center gap-2"
                >
                    <FaImages />
                    اختر من المكتبة
                </button>
            </div>

            {/* نافذة المكتبة المنبثقة */}
            {showLibrary && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* رأس النافذة */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="text-white text-lg font-light flex items-center gap-2">
                                <FaImages className="text-amber-500" />
                                مكتبة الصور المرفوعة
                            </h3>
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* شريط البحث */}
                        <div className="p-4 border-b border-gray-700">
                            <div className="relative">
                                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="بحث في الصور..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 bg-black border border-gray-700 text-white focus:border-amber-500 focus:outline-none rounded-lg"
                                />
                            </div>
                        </div>

                        {/* شبكة الصور */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredImages.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    {savedImages.length === 0 ? (
                                        <>
                                            <FaImages className="text-4xl mx-auto mb-3 text-gray-600" />
                                            <p className="mb-2">لا توجد صور مرفوعة مسبقاً</p>
                                            <p className="text-sm">ارفع صوراً جديدة باستخدام زر "رفع صورة جديدة"</p>
                                        </>
                                    ) : (
                                        <p>لا توجد نتائج مطابقة للبحث</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {filteredImages.map((url, index) => (
                                        <div
                                            key={index}
                                            onClick={() => selectFromLibrary(url)}
                                            className="relative group cursor-pointer border-2 border-gray-700 hover:border-amber-500 transition-colors rounded-lg overflow-hidden bg-black"
                                        >
                                            <img
                                                src={url}
                                                alt={`صورة ${index + 1}`}
                                                className="w-full aspect-square object-cover"
                                            />
                                            <button
                                                onClick={(e) => deleteFromLibrary(url, e)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                اختر
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* زر إغلاق */}
                        <div className="p-4 border-t border-gray-700 text-right">
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="px-6 py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors rounded-lg flex items-center gap-2 ml-auto"
                            >
                                <FaTimes />
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}