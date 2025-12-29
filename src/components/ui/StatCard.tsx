"use client";

import React from "react";

type StatCardColor = "blue" | "green" | "purple" | "red" | "yellow";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: StatCardColor;
  className?: string;
}

const colorVariants: Record<StatCardColor, { bg: string; text: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-600 dark:text-blue-300",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-600 dark:text-green-300",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-600 dark:text-purple-300",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-600 dark:text-red-300",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-600 dark:text-yellow-300",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  className = ""
}: StatCardProps) {
  const colorClasses = colorVariants[color];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 ${className}`.trim()}>
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${colorClasses.bg} rounded-full flex items-center justify-center`}>
              <div className={`w-5 h-5 ${colorClasses.text}`}>
                {icon}
              </div>
            </div>
          </div>
        )}
        <div className={icon ? "ml-4" : ""}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          <div className="mt-1">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}