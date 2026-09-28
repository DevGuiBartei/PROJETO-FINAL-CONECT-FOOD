import React from 'react';

interface BadgeProps {
  variant: 'active' | 'removed' | 'inactive' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
}) => {

  const styles = {
    active: 'bg-red-50 text-[#FF2C2C] border-red-200',
    removed: 'bg-red-50 text-[#FF2C2C] border-red-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    info: 'bg-gray-100 text-gray-700 border-gray-200',
    warning: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
