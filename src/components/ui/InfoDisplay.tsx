import React from "react";

interface InfoDisplayProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export default function InfoDisplay({
  label,
  children,
  className = ""
}: InfoDisplayProps) {
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}:
      </dt>
      <dd className="text-sm text-gray-900 dark:text-white">
        {children}
      </dd>
    </div>
  );
}