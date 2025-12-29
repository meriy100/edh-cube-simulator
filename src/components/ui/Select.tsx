"use client";

import React from "react";

type SelectSize = "sm" | "md" | "lg";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  size?: SelectSize;
  error?: boolean;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const selectSizes: Record<SelectSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

export default function Select({
  size = "md",
  error = false,
  fullWidth = false,
  options,
  placeholder,
  className = "",
  disabled,
  ...props
}: SelectProps) {
  const sizeClasses = selectSizes[size];
  const widthClasses = fullWidth ? "w-full" : "";
  const errorClasses = error
    ? "border-red-300 dark:border-red-700 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500";
  const disabledClasses = disabled
    ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

  const baseClasses = "rounded-md focus:outline-none focus:ring-2 border transition-colors";

  return (
    <select
      className={`${baseClasses} ${sizeClasses} ${widthClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}