"use client";

import React from "react";

type LoadingSpinnerSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  text?: string;
  className?: string;
}

const spinnerSizes: Record<LoadingSpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = spinnerSizes[size];
  const spinnerClasses = `animate-spin rounded-full border-b-2 border-gray-900 dark:border-white ${sizeClasses}`;

  if (text) {
    return (
      <div className={`flex items-center justify-center ${className}`.trim()}>
        <div className="text-center">
          <div className={`${spinnerClasses} mx-auto`} />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
        </div>
      </div>
    );
  }

  return <div className={`${spinnerClasses} ${className}`.trim()} />;
}