"use client";

import React from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertVariants: Record<AlertVariant, string> = {
  error:
    "border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/20 text-red-800 dark:text-red-300",
  success:
    "border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-900/20 text-green-800 dark:text-green-300",
  warning:
    "border-yellow-300 dark:border-yellow-700 bg-yellow-50/60 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
  info: "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
};

export default function Alert({
  variant = "info",
  children,
  onClose,
  className = "",
}: AlertProps) {
  const variantClasses = alertVariants[variant];
  const baseClasses = "border rounded p-3 text-sm";

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`.trim()}>
      <div className={`flex ${onClose ? "justify-between items-start" : ""}`}>
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none"
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}