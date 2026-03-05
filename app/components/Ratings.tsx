'use client';

import { useState, useEffect } from 'react';
import { getProductRatings, addRating, getProductAverageRating, Rating } from '@/app/lib/ratings';

interface RatingsProps {
    productId: number;
}

export default function Ratings({ productId }: RatingsProps) {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [average, setAverage] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [userName, setUserName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRatings();
    }, [productId]);

    const loadRatings = async () => {
        const data = await getProductRatings(productId);
        setRatings(data);

        const avg = await getProductAverageRating(productId);
        setAverage(avg.average);
        setTotalRatings(avg.count);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const newRating = await addRating({
            product_id: productId,
            user_name: userName || 'مستخدم',
            rating,
            comment: comment || undefined
        });

        if (newRating) {
            await loadRatings();
            setShowForm(false);
            setUserName('');
            setRating(5);
            setComment('');
        }

        setSubmitting(false);
    };

    // عرض النجوم
    const renderStars = (value: number, interactive = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={interactive ? () => setRating(i) : undefined}
                    className={`text-2xl ${interactive ? 'cursor-pointer' : 'cursor-default'} ${i <= value ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    ★
                </button>
            );
        }
        return stars;
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-light text-[#2c2c2c] mb-6">التقييمات</h2>

            {/* ملخص التقييمات */}
            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-light text-[#2c2c2c]">{average.toFixed(1)}</div>
                <div>
                    <div className="flex">{renderStars(Math.round(average))}</div>
                    <p className="text-gray-500 text-sm">{totalRatings} تقييم</p>
                </div>
            </div>

            {/* زر إضافة تقييم */}
            <button
                onClick={() => setShowForm(!showForm)}
                className="mb-6 px-4 py-2 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors text-sm"
            >
                {showForm ? 'إلغاء' : 'أضف تقييمك'}
            </button>

            {/* نموذج إضافة تقييم */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white border border-gray-200">
                    <h3 className="text-[#2c2c2c] font-medium mb-4">أضف تقييمك</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-600 text-sm mb-1">الاسم</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="اسمك (اختياري)"
                                className="w-full px-3 py-2 border border-gray-200 focus:border-[#2c2c2c] focus:outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 text-sm mb-1">التقييم</label>
                            <div className="flex gap-1">
                                {renderStars(rating, true)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-600 text-sm mb-1">التعليق</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 focus:border-[#2c2c2c] focus:outline-none text-sm resize-none"
                                placeholder="اكتب رأيك في المنتج..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-[#2c2c2c] text-white hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
                        >
                            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                    </div>
                </form>
            )}

            {/* قائمة التقييمات */}
            <div className="space-y-4">
                {ratings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا توجد تقييمات بعد</p>
                ) : (
                    ratings.map((r) => (
                        <div key={r.id} className="bg-white p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-[#2c2c2c]">{r.user_name}</span>
                                <span className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('ar')}</span>
                            </div>
                            <div className="flex mb-2">
                                {renderStars(r.rating)}
                            </div>
                            {r.comment && (
                                <p className="text-gray-600 text-sm">{r.comment}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}