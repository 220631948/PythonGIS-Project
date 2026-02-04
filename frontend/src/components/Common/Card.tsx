import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, actions, className = '' }) => (
  <div className={`card-header flex items-center justify-between p-4 border-b border-slate-100 ${className}`}>
    <div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="card-actions">{actions}</div>}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`card-content p-4 ${className}`}>
    {children}
  </div>
);

/**
 * Card component following compound component pattern
 */
export const Card: React.FC<CardProps> & { Header: typeof CardHeader; Content: typeof CardContent } = ({
  children,
  className = '',
  elevated = false,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-xl border border-slate-200 overflow-hidden transition-all';
  const elevationClass = elevated ? 'shadow-lg' : 'hover:shadow-md';
  const cursorClass = onClick ? 'cursor-pointer hover:border-emerald-300' : '';

  return (
    <div 
      className={`${baseClasses} ${elevationClass} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;

export default Card;
