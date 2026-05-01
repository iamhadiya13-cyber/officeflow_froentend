import clsx from 'clsx';

export const Skeleton = ({ className }) => (
  <div className={clsx('bg-gray-200 rounded animate-pulse', className)} />
);
