import clsx from 'clsx';

export const Skeleton = ({ className }) => (
  <div className={clsx('bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded animate-pulse', className)} />
);
