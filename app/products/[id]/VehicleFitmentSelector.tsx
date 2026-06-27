'use client';

import { useState, useMemo } from 'react';
import { VehicleFitment } from '@/app/lib/products';
import { useToast } from '@/app/components/Toast';
import { FaCar, FaSearch, FaTimes, FaChevronLeft, FaChevronRight, FaMinus, FaPlus, FaCheck } from 'react-icons/fa';

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

const INITIAL_MAKES_DISPLAY = 6; // عدد الماركات الظاهرة قبل "عرض المزيد"

export default function VehicleFitmentSelector({
    fitments,
    basePrice,
    discount,
    onSelect
}: VehicleFitmentSelectorProps) {
    const { showToast } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedFitment, setSelectedFitment] = useState<VehicleFitment | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllMakes, setShowAllMakes] = useState(false); // للتحكم في عرض الماركات

    const availableFitments = fitments.filter(f => f.stock > 0);

    const makes = useMemo(() => {
        return [...new Set(availableFitments.map(f => f.make))].sort();
    }, [availableFitments]);

    const models = useMemo(() => {
        if (!selectedMake) return [];
        return [...new Set(
            availableFitments.filter(f => f.make === selectedMake).map(f => f.model)
        )].sort();
    }, [availableFitments, selectedMake]);

    const years = useMemo(() => {
        if (!selectedMake || !selectedModel) return [];
        return availableFitments
            .filter(f => f.make === selectedMake && f.model === selectedModel)
            .sort((a, b) => b.year - a.year);
    }, [availableFitments, selectedMake, selectedModel]);

    const filteredMakes = useMemo(() => {
        if (!searchQuery.trim()) return makes;
        const q = searchQuery.toLowerCase();
        return makes.filter(make =>
            make.toLowerCase().includes(q) ||
            availableFitments.some(f =>
                f.make === make && f.model.toLowerCase().includes(q)
            )
        );
    }, [makes, searchQuery, availableFitments]);

    // تقسيم الماركات: الظاهر منها والمخفي (إذا تجاوز العدد الحد)
    const displayedMakes = useMemo(() => {
        if (showAllMakes || filteredMakes.length <= INITIAL_MAKES_DISPLAY) return filteredMakes;
        return filteredMakes.slice(0, INITIAL_MAKES_DISPLAY);
    }, [filteredMakes, showAllMakes]);

    const hiddenMakesCount = filteredMakes.length - INITIAL_MAKES_DISPLAY;

    const calculateFinalPrice = (fitment: VehicleFitment) => {
        let price = basePrice;
        if (discount) price = price - (price * discount / 100);
        return price + (fitment.extraPrice || 0);
    };

    const handleMakeSelect = (make: string) => {
        setSelectedMake(make);
        setSelectedModel(null);
        setSelectedFitment(null);
        setStep(2);
        setSearchQuery('');
    };

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        setSelectedFitment(null);
        setStep(3);
    };

    const handleYearSelect = (fitment: VehicleFitment) => {
        setSelectedFitment(fitment);
        setQuantity(1);
        onSelect({ fitment, quantity: 1, finalPrice: calculateFinalPrice(fitment) });
    };

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

    const closeModal = () => {
        setModalOpen(false);
        setStep(1);
        setSearchQuery('');
        setShowAllMakes(false);
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedFitment(null);
        } else if (step === 2) {
            setStep(1);
            setSelectedModel(null);
        }
    };

    // عرض مباشر إذا كانت التوافقات ≤ 5
    if (availableFitments.length <= 5) {
        return (
            <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-[#2c2c2c] text-sm font-medium mb-3 flex items-center gap-2">
                    <FaCar className="text-gray-500" />
                    اختر نوع سيارتك
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {availableFitments.map((fitment) => {
                        const finalPrice = calculateFinalPrice(fitment);
                        const isSelected = selectedFitment?.id === fitment.id;
                        return (
                            <button
                                key={fitment.id}
                                type="button"
                                onClick={() => {
                                    setSelectedFitment(fitment);
                                    setQuantity(1);
                                    onSelect({ fitment, quantity: 1, finalPrice: calculateFinalPrice(fitment) });
                                }}
                                className={`p-3 border rounded-lg text-right transition-all ${isSelected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-[#2c2c2c]">{fitment.make} {fitment.model}</div>
                                        <div className="text-sm text-gray-500">سنة {fitment.year} | متوفر: {fitment.stock} قطعة</div>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-amber-600 font-semibold">JD {finalPrice.toFixed(2)}</div>
                                        {fitment.extraPrice !== 0 && (
                                            <div className="text-xs text-gray-400">{fitment.extraPrice > 0 ? `+${fitment.extraPrice}` : `${fitment.extraPrice}`}</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {selectedFitment && (
                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                        <span className="text-gray-600 text-sm">الكمية المطلوبة:</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => updateQuantity(-1)} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded"><FaMinus size={12} /></button>
                            <span className="w-10 text-center font-medium">{quantity}</span>
                            <button type="button" onClick={() => updateQuantity(1)} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded"><FaPlus size={12} /></button>
                            <span className="text-gray-400 text-sm">/ {selectedFitment.stock} متبقي</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Modal للتعداد الكبير
    return (
        <div className="mb-8">
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all text-right group"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-medium text-[#2c2c2c] group-hover:text-amber-600">
                            {selectedFitment
                                ? `✅ ${selectedFitment.make} ${selectedFitment.model} (${selectedFitment.year})`
                                : '🚗 اختر نوع سيارتك'}
                        </span>
                        {selectedFitment && (
                            <div className="text-sm text-amber-600 mt-1">JD {calculateFinalPrice(selectedFitment).toFixed(2)} × {quantity}</div>
                        )}
                    </div>
                    <FaCar className="text-2xl group-hover:text-amber-600" />
                </div>
            </button>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors"><FaTimes size={20} /></button>
                            <h3 className="text-[#2c2c2c] font-medium text-lg">
                                {step === 1 && 'اختر الماركة'}
                                {step === 2 && 'اختر الموديل'}
                                {step === 3 && 'اختر السنة'}
                            </h3>
                            {step > 1 ? (
                                <button type="button" onClick={handleBack} className="text-amber-600 hover:text-amber-700 text-sm flex items-center gap-1"><FaChevronLeft size={14} /> رجوع</button>
                            ) : <div className="w-12" />}
                        </div>

                        {/* Breadcrumb */}
                        <div className="px-4 py-2 bg-gray-50 text-sm flex items-center gap-1 text-gray-500">
                            <span className={selectedMake ? 'text-amber-600 font-medium' : ''}>{selectedMake || '...'}</span>
                            {selectedMake && <FaChevronRight size={10} />}
                            <span className={selectedModel ? 'text-amber-600 font-medium' : ''}>{selectedModel || '...'}</span>
                            {selectedModel && <FaChevronRight size={10} />}
                            <span className={selectedFitment ? 'text-amber-600 font-medium' : ''}>{selectedFitment?.year || '...'}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {step === 1 && (
                                <>
                                    <div className="relative mb-3">
                                        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setShowAllMakes(false); }}
                                            placeholder="ابحث عن ماركة أو موديل..."
                                            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {displayedMakes.map(make => (
                                            <button
                                                key={make}
                                                type="button"
                                                onClick={() => handleMakeSelect(make)}
                                                className="p-3 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-right"
                                            >
                                                <span className="font-medium text-[#2c2c2c]">{make}</span>
                                                <span className="text-xs text-gray-400 block">{availableFitments.filter(f => f.make === make).length} موديل</span>
                                            </button>
                                        ))}
                                    </div>
                                    {!showAllMakes && hiddenMakesCount > 0 && (
                                        <button
                                            onClick={() => setShowAllMakes(true)}
                                            className="w-full mt-2 py-2 text-center text-sm text-amber-600 hover:text-amber-700 border border-dashed border-amber-300 rounded-lg"
                                        >
                                            عرض {hiddenMakesCount} ماركة أخرى
                                        </button>
                                    )}
                                    {filteredMakes.length === 0 && (
                                        <p className="text-center text-gray-400 py-8">لا توجد نتائج</p>
                                    )}
                                </>
                            )}

                            {step === 2 && selectedMake && (
                                <div className="space-y-2">
                                    {models.map(model => (
                                        <button
                                            key={model}
                                            type="button"
                                            onClick={() => handleModelSelect(model)}
                                            className="w-full p-3 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-right flex justify-between items-center"
                                        >
                                            <span className="font-medium text-[#2c2c2c]">{model}</span>
                                            <span className="text-xs text-gray-400">{availableFitments.filter(f => f.make === selectedMake && f.model === model).length} سنة</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step === 3 && selectedMake && selectedModel && (
                                <div className="space-y-3">
                                    {years.map(fitment => {
                                        const finalPrice = calculateFinalPrice(fitment);
                                        const isSelected = selectedFitment?.id === fitment.id;
                                        return (
                                            <button
                                                key={fitment.id}
                                                type="button"
                                                onClick={() => handleYearSelect(fitment)}
                                                className={`w-full p-4 border rounded-lg text-right transition-all ${isSelected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-400'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium text-[#2c2c2c]">{fitment.make} {fitment.model} - {fitment.year}</div>
                                                        <div className="text-sm text-gray-500">متوفر: {fitment.stock} قطعة</div>
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-amber-600 font-semibold text-lg">JD {finalPrice.toFixed(2)}</div>
                                                        {fitment.extraPrice !== 0 && <div className="text-xs text-gray-400">{fitment.extraPrice > 0 ? `+${fitment.extraPrice}` : `${fitment.extraPrice}`}</div>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {selectedFitment && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-600 text-sm">الكمية:</span>
                                    <button type="button" onClick={() => updateQuantity(-1)} className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white rounded"><FaMinus size={12} /></button>
                                    <span className="w-10 text-center font-medium">{quantity}</span>
                                    <button type="button" onClick={() => updateQuantity(1)} className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white rounded"><FaPlus size={12} /></button>
                                    <span className="text-gray-400 text-sm">/ {selectedFitment.stock}</span>
                                </div>
                                <button type="button" onClick={closeModal} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1"><FaCheck size={14} /> تم</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}