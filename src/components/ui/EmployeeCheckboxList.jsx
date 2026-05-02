import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

const CheckboxIcon = ({ isChecked }) => (
  <motion.div
    animate={{ scale: isChecked ? [1, 0.85, 1] : 1 }}
    transition={{ duration: 0.15 }}
    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
      isChecked ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'
    }`}
  >
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />
    </motion.svg>
  </motion.div>
);

const IndeterminateIcon = ({ isPartial }) => (
  <motion.div
    animate={{ scale: isPartial ? [1, 0.85, 1] : 1 }}
    transition={{ duration: 0.15 }}
    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
      isPartial ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'
    }`}
  >
    {isPartial && <div className="w-2.5 h-[3px] bg-white rounded-full" />}
  </motion.div>
);

export const EmployeeCheckboxList = ({
  employees = [],
  selected = [],
  onChange,
  showSelectAll = true,
  maxHeight = '240px'
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const s = search.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(s) || 
      (emp.department && emp.department.toLowerCase().includes(s))
    );
  }, [employees, search]);

  const allFilteredIds = filtered.map(e => e.id);
  
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.includes(id));
  const someSelected = allFilteredIds.length > 0 && allFilteredIds.some(id => selected.includes(id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onChange(selected.filter(id => !allFilteredIds.includes(id)));
    } else {
      const newSelected = new Set(selected);
      allFilteredIds.forEach(id => newSelected.add(id));
      onChange(Array.from(newSelected));
    }
  };

  const toggleRow = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0][0] || '').toUpperCase();
  };

  return (
    <div className="flex flex-col w-full text-left">
      <div className="relative mb-2 shrink-0">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-[#e5e7eb] rounded-btn pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {showSelectAll && filtered.length > 0 && (
        <div 
          onClick={handleSelectAll}
          className="flex items-center gap-3 px-2 py-2 mb-1 border-b border-[#e5e7eb] cursor-pointer hover:bg-gray-50 transition-colors select-none shrink-0 text-gray-900"
        >
          {someSelected ? <IndeterminateIcon isPartial={someSelected} /> : <CheckboxIcon isChecked={allSelected} />}
          <span className="text-sm font-medium text-gray-700">Select All ({filtered.length})</span>
        </div>
      )}

      <div style={{ maxHeight }} className="overflow-y-auto space-y-0.5 custom-scrollbar pb-1">
        {filtered.length === 0 ? (
          <div className="text-sm text-center text-gray-500 py-4">No employees found</div>
        ) : (
          filtered.map(emp => {
            const isChecked = selected.includes(emp.id);
            return (
              <motion.div
                key={emp.id}
                onClick={() => toggleRow(emp.id)}
                animate={{ backgroundColor: isChecked ? 'rgba(79,70,229,0.05)' : 'transparent' }}
                whileHover={{ backgroundColor: isChecked ? 'rgba(79,70,229,0.08)' : 'rgba(249,250,251,1)' }}
                className="flex items-center gap-3 px-2 py-2 rounded cursor-pointer select-none transition-colors text-gray-900"
              >
                <CheckboxIcon isChecked={isChecked} />
                <div className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {getInitials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.department}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex justify-center mt-2 shrink-0 pt-2 border-t border-[#e5e7eb]"
          >
            <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
              {selected.length} employee(s) selected
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
