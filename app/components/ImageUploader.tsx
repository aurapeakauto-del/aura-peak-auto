'use client';

import { useState } from 'react';

interface ImageUploaderProps {
    onUpload: (url: string) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aura_peak_preset'); // أنشئ هذا من لوحة Cloudinary

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await res.json();
            onUpload(data.secure_url);
            alert('✅ تم رفع الصورة بنجاح');
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            alert('❌ فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-2">
            <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-none file:border-0
                    file:text-sm file:font-medium
                    file:bg-[#2c2c2c] file:text-white
                    hover:file:bg-gray-800"
            />
            {uploading && <p className="text-sm text-gray-500 mt-2">جاري الرفع...</p>}
        </div>
    );
}