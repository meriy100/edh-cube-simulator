"use client";

import React from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ActionCard({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  className = ""
}: ActionCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`p-4 text-left rounded-lg border dark:border-gray-600 transition-colors ${
        onClick && !disabled
          ? "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </div>
    </Component>
  );
}