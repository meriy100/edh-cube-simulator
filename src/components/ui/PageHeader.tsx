import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backElement?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backElement,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`.trim()}>
      {backElement}
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <div className="text-sm opacity-70 mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
