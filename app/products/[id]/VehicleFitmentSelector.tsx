'use client';

import { useState } from 'react';
import { VehicleFitment } from '@/app/lib/products';
import { useToast } from '@/app/components/Toast';

interface VehicleFitmentSelectorProps {
    fitments: VehicleFitment[];
    basePrice: number;
    discount?: number;
    onSelect: (selected: {
        fitment: VehicleFitment;
        quantity: number;
        finalPrice: number;
    } | null) => void;
}

export default function VehicleFitmentSelector({
    fitments,
    basePrice,
    discount,
    onSelect
}: VehicleFitmentSelectorProps) {
    const { showToast } = useToast();
    const [selectedFitmentId, setSelectedFitmentId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // فلترة التوافقات المتاحة (التي لها كمية > 0)
    const availableFitments = fitments.filter(f => f.stock > 0);

    const selectedFitment = availableFitments.find(f => f.id === selectedFitmentId);

    // حساب السعر النهائي
    const calculateFinalPrice = (fitment: VehicleFitment) => {
        let price = basePrice;
        if (discount) {
            price = price - (price * discount / 100);
        }
        return price + (fitment.extraPrice || 0);
    };

    // عند اختيار توافق
    const handleFitmentSelect = (fitmentId: string) => {
        setSelectedFitmentId(fitmentId);
        setQuantity(1);
        
        const fitment = availableFitments.find(f => f.id === fitmentId);
        if (fitment) {
            onSelect({
                fitment,
                quantity: 1,
                finalPrice: calculateFinalPrice(fitment)
            });
        }
    };

    // تحديث الكمية
    const updateQuantity = (delta: number) => {
        if (!selectedFitment) return;
        
        const newQuantity = quantity + delta;
        if (newQuantity < 1) return;
        if (newQuantity > selectedFitment.stock) {
            showToast(`الكمية المتوفرة هي ${selectedFitment.stock} قطع فقط`, 'warning');
            return;
        }
        
        setQuantity(newQuantity);
        onSelect({
            fitment: selectedFitment,
            quantity: newQuantity,
            finalPrice: calculateFinalPrice(selectedFitment)
        });
    };

    // إذا كان عدد التوافقات قليلاً (أقل من 5)، نعرضها كأزرار
    if (availableFitments.length <= 5) {
        return (
            <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">اختر نوع سيارتك</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {availableFitments.map((fitment) => {
                        const finalPrice = calculateFinalPrice(fitment);
                        const isSelected = selectedFitmentId === fitment.id;
                        
                        return (
                            <button
                                key={fitment.id}
                                type="button"
                                onClick={() => handleFitmentSelect(fitment.id)}
                                className={`p-3 border rounded-lg text-right transition-all ${
                                    isSelected
                                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                                        : 'border-gray-200 hover:border-gray-400 bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-[#2c2c2c]">
                                            {fitment.make} {fitment.model}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            سنة {fitment.year} | متوفر: {fitment.stock} قطعة
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-amber-600 font-semibold">
                                            JD {finalPrice.toFixed(2)}
                                        </div>
                                        {fitment.extraPrice !== 0 && (
                                            <div className="text-xs text-gray-400">
                                                {fitment.extraPrice > 0 ? `+${fitment.extraPrice}` : `${fitment.extraPrice}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* أزرار الكمية بعد الاختيار */}
                {selectedFitment && (
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">الكمية المطلوبة:</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(-1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                >
                                    −
                                </button>
                                <span className="text-[#2c2c2c] w-10 text-center font-medium">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                                >
                                    +
                                </button>
                                <span className="text-gray-400 text-sm">
                                    / {selectedFitment.stock} متبقي
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // إذا كان عدد التوافقات كبيراً، نستخدم قائمة منسدلة مع بحث
    return (
        <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-[#2c2c2c] text-sm font-medium mb-3">اختر نوع سيارتك</h3>
            
            <div className="relative">
                <select
                    value={selectedFitmentId || ''}
                    onChange={(e) => handleFitmentSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-[#2c2c2c] focus:border-amber-500 focus:outline-none rounded-lg appearance-none"
                >
                    <option value="">-- اختر الماركة والموديل --</option>
                    {availableFitments.map((fitment) => {
                        const finalPrice = calculateFinalPrice(fitment);
                        return (
                            <option key={fitment.id} value={fitment.id}>
                                {fitment.make} {fitment.model} ({fitment.year}) - متوفر: {fitment.stock} - JD {finalPrice.toFixed(2)}
                                {fitment.extraPrice !== 0 && fitment.extraPrice > 0 ? ` (+${fitment.extraPrice})` : ''}
                            </option>
                        );
                    })}
                </select>
                <div className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ▼
                </div>
            </div>

            {/* أزرار الكمية بعد الاختيار */}
            {selectedFitment && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-gray-600">
                            السعر: <span className="text-amber-600 font-semibold">
                                JD {calculateFinalPrice(selectedFitment).toFixed(2)}
                            </span>
                            {selectedFitment.extraPrice !== 0 && (
                                <span className="text-xs text-gray-400 mr-2">
                                    ({selectedFitment.extraPrice > 0 ? `+${selectedFitment.extraPrice}` : `${selectedFitment.extraPrice}`})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-sm">الكمية:</span>
                            <button
                                type="button"
                                onClick={() => updateQuantity(-1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                            >
                                −
                            </button>
                            <span className="text-[#2c2c2c] w-10 text-center font-medium">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => updateQuantity(1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 text-[#2c2c2c] bg-white hover:bg-gray-100 transition-colors rounded"
                            >
                                +
                            </button>
                            <span className="text-gray-400 text-sm">
                                / {selectedFitment.stock} متبقي
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}