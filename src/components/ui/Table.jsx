import { motion } from 'framer-motion';
import { Skeleton } from './Skeleton';

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

export const Table = ({ columns, data, loading, onRowClick, emptyMessage = 'No data found', rowClassName }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-card border border-[#e5e7eb] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-card border border-[#e5e7eb]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] bg-white">
          <thead className="bg-[#f8f8f8] border-b border-[#e5e7eb]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((row, i) => (
                <motion.tr
                  key={row.id || i}
                  variants={rowVariants}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  layout
                  className={`border-b border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer ${rowClassName?.(row) || ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 md:px-4 md:py-12 text-center text-sm text-gray-400">
                  {typeof emptyMessage === 'string' ? emptyMessage : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
