import clsx from 'clsx';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800',
  approved: 'bg-green-50 text-green-800',
  rejected: 'bg-red-50 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-50 text-blue-800',
  cancelled: 'bg-gray-200 text-gray-600',
};

export const Badge = ({ status, className }) => {
  return (
    <span className={clsx(
      'inline-flex items-center w-fit text-xs font-medium px-2.5 py-1 rounded-badge capitalize ring-1 ring-inset ring-black/5',
      statusStyles[status] || 'bg-gray-100 text-gray-600',
      className
    )}>
      {status}
    </span>
  );
};

export const StatusBadge = Badge;

const typeStyles = {
  FOOD: 'bg-green-50 text-green-800',
  OTHER: 'bg-indigo-50 text-indigo-800',
  TRIP: 'bg-cyan-50 text-cyan-800',
  TEAM_FUND: 'bg-violet-50 text-violet-800',
};

export const TypeChip = ({ type, className }) => {
  return (
    <span className={clsx(
      'inline-flex items-center w-fit text-xs font-medium px-2.5 py-1 rounded-badge ring-1 ring-inset ring-black/5',
      typeStyles[type] || 'bg-gray-100 text-gray-600',
      className
    )}>
      {type}
    </span>
  );
};
