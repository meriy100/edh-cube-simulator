"use client";

import React from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
  fullWidth?: boolean;
}

const inputSizes: Record<InputSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

export default function Input({
  size = "md",
  error = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: InputProps) {
  const sizeClasses = inputSizes[size];
  const widthClasses = fullWidth ? "w-full" : "";
  const errorClasses = error
    ? "border-red-300 dark:border-red-700 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500";
  const disabledClasses = disabled
    ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

  const baseClasses = "rounded-md focus:outline-none focus:ring-2 border transition-colors";

  return (
    <input
      className={`${baseClasses} ${sizeClasses} ${widthClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
      disabled={disabled}
      {...props}
    />
  );
}