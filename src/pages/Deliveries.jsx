import { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuthStore } from '@/store/authStore';
import { useDeliveries, useUpdateDailyDelivery, useUpdateDeliveryPrice, useDeleteDailyDelivery } from '@/hooks/useDeliveries';
import { ChevronLeft, ChevronRight, Coffee, Trash2, Package, X, Milk } from 'lucide-react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, addMonths, subMonths, isToday 
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const Deliveries = () => {
  const user = useAuthStore(s => s.user);
  const isPrivileged = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER' || user?.role === 'HR';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthString = format(currentDate, 'yyyy-MM');
  
  const { data, isLoading } = useDeliveries(monthString);
  const updateDelivery = useUpdateDailyDelivery();
  const updatePrice = useUpdateDeliveryPrice();
  const deleteDelivery = useDeleteDailyDelivery();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  const [deliveryForm, setDeliveryForm] = useState({ waterUnits: 0, teaUnits: 0 });
  const [priceForm, setPriceForm] = useState({ waterPrice: 0, teaPrice: 0 });

  const deliveries = data?.deliveries || [];
  const prices = data?.price || { waterPrice: 0, teaPrice: 0 };

  const getDeliveryForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return deliveries.find(d => d.date === dateStr);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // Calculations
  const totalWaterUnits = deliveries.reduce((acc, curr) => acc + (curr.waterUnits || 0), 0);
  const totalTeaUnits = deliveries.reduce((acc, curr) => acc + (curr.teaUnits || 0), 0);
  const totalWaterCost = totalWaterUnits * (prices.waterPrice || 0);
  const totalTeaCost = totalTeaUnits * (prices.teaPrice || 0);
  const totalCost = totalWaterCost + totalTeaCost;

  const handleDayClick = (day) => {
    if (!isPrivileged) return; 
    const delivery = getDeliveryForDate(day);
    setSelectedDate(day);
    setDeliveryForm({
      waterUnits: delivery?.waterUnits || 0,
      teaUnits: delivery?.teaUnits || 0,
    });
    setShowDeliveryModal(true);
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await updateDelivery.mutateAsync({
      date: dateStr,
      waterUnits: Number(deliveryForm.waterUnits),
      teaUnits: Number(deliveryForm.teaUnits)
    });
    setShowDeliveryModal(false);
  };

  const handleDeleteDelivery = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await deleteDelivery.mutateAsync(dateStr);
    setShowDeliveryModal(false);
  };

  const openPriceModal = () => {
    setPriceForm({
      waterPrice: prices.waterPrice || 0,
      teaPrice: prices.teaPrice || 0
    });
    setShowPriceModal(true);
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    await updatePrice.mutateAsync({
      month: monthString,
      waterPrice: Number(priceForm.waterPrice),
      teaPrice: Number(priceForm.teaPrice)
    });
    setShowPriceModal(false);
  };

  return (
    <PageLayout title="Daily Deliveries">
      <div className="space-y-6">
        {/* Header & Controls */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6" /> Deliveries
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-transparent border border-gray-300 dark:border-gray-700 rounded-full overflow-hidden transition-all hover:border-gray-900 dark:hover:border-white">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5 dark:text-white text-gray-900" />
              </button>
              <div className="px-4 font-semibold text-sm tracking-wide dark:text-white text-gray-900 min-w-[130px] text-center uppercase">
                {format(currentDate, 'MMM yyyy')}
              </div>
              <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ChevronRight className="w-5 h-5 dark:text-white text-gray-900" />
              </button>
            </div>
            
            {isPrivileged && (
              <button onClick={openPriceModal} className="px-5 py-2 text-sm font-semibold rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity">
                Set Prices
              </button>
            )}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              <Milk className="w-5 h-5 text-gray-900 dark:text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Water</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{totalWaterUnits}</p>
              <p className="text-xs text-gray-500 mt-1">@ Rs.{prices.waterPrice}/unit = Rs.{totalWaterCost}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 text-gray-900 dark:text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tea</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{totalTeaUnits}</p>
              <p className="text-xs text-gray-500 mt-1">@ Rs.{prices.teaPrice}/unit = Rs.{totalTeaCost}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-black dark:bg-white rounded-2xl p-6 border border-transparent shadow-lg text-white dark:text-black flex items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-white/20 dark:border-black/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Month Cost</p>
              <p className="text-3xl font-black">Rs. {totalCost.toLocaleString('en-IN')}</p>
            </div>
          </motion.div>
        </div>

        {/* Calendar Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const delivery = getDeliveryForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              
              return (
                <motion.div 
                  whileHover={isCurrentMonth && isPrivileged ? { scale: 0.97, backgroundColor: 'rgba(0,0,0,0.02)' } : {}}
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[120px] border-b border-r border-gray-200 dark:border-gray-800/60 p-3 transition-colors relative
                    ${!isCurrentMonth ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}
                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors
                      ${today ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-900 dark:text-white'}
                    `}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {delivery && (delivery.waterUnits > 0 || delivery.teaUnits > 0) && (
                    <div className="mt-3 space-y-2">
                      {delivery.waterUnits > 0 && (
                        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium">
                          <span className="flex items-center gap-1.5 opacity-70"><Milk className="w-3 h-3"/> Water</span>
                          <span className="font-bold">{delivery.waterUnits}</span>
                        </div>
                      )}
                      {delivery.teaUnits > 0 && (
                        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium">
                          <span className="flex items-center gap-1.5 opacity-70"><Coffee className="w-3 h-3"/> Tea</span>
                          <span className="font-bold">{delivery.teaUnits}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sleek Custom Modals */}
      <AnimatePresence>
        {showDeliveryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeliveryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#111] rounded-[24px] shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold dark:text-white">Update Units</h2>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
                <button onClick={() => setShowDeliveryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDeliverySubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Milk className="w-3 h-3" /> Water Units
                  </label>
                  <input 
                    type="number" min="0" value={deliveryForm.waterUnits} onChange={e => setDeliveryForm(prev => ({...prev, waterUnits: e.target.value}))}
                    className="w-full bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-xl px-4 py-3 text-lg font-bold dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Coffee className="w-3 h-3" /> Tea Units
                  </label>
                  <input 
                    type="number" min="0" value={deliveryForm.teaUnits} onChange={e => setDeliveryForm(prev => ({...prev, teaUnits: e.target.value}))}
                    className="w-full bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-xl px-4 py-3 text-lg font-bold dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button type="button" onClick={handleDeleteDelivery} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={updateDelivery.isPending} className="flex-1 bg-black text-white dark:bg-white dark:text-black rounded-xl py-3.5 font-bold hover:scale-[0.98] transition-transform flex justify-center">
                    {updateDelivery.isPending ? 'Saving...' : 'Save Deliveries'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPriceModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#111] rounded-[24px] shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold dark:text-white">Set Prices</h2>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</p>
                </div>
                <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePriceSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Water Price (Rs/Unit)</label>
                  <input 
                    type="number" min="0" step="0.01" value={priceForm.waterPrice} onChange={e => setPriceForm(prev => ({...prev, waterPrice: e.target.value}))} required
                    className="w-full bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-xl px-4 py-3 text-lg font-bold dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tea Price (Rs/Unit)</label>
                  <input 
                    type="number" min="0" step="0.01" value={priceForm.teaPrice} onChange={e => setPriceForm(prev => ({...prev, teaPrice: e.target.value}))} required
                    className="w-full bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-xl px-4 py-3 text-lg font-bold dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
                  />
                </div>
                
                <div className="pt-4">
                  <button type="submit" disabled={updatePrice.isPending} className="w-full bg-black text-white dark:bg-white dark:text-black rounded-xl py-3.5 font-bold hover:scale-[0.98] transition-transform flex justify-center">
                    {updatePrice.isPending ? 'Saving...' : 'Apply Pricing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
};
