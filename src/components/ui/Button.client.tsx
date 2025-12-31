"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: LucideIcon;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300",
  secondary:
    "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300",
  outline:
    "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300",
  ghost:
    "border-black/20 dark:border-white/20 hover:bg-foreground hover:text-background disabled:opacity-60",
  danger:
    "text-sm underline text-red-600 bg-transparent border-none hover:opacity-80 disabled:opacity-60",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const iconSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  icon,
  ...props
}: ButtonProps) {
  const baseClasses =
    "rounded font-semibold border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";

  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];

  // For danger variant, remove border and padding adjustments
  const isDangerVariant = variant === "danger";
  const finalClasses = isDangerVariant
    ? `${variantClasses} ${className}`.trim()
    : `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  const IconComponent = icon;
  const iconSize = iconSizes[size];

  return (
    <button className={finalClasses} disabled={disabled} {...props}>
      <div className="flex items-center justify-center gap-2">
        {IconComponent && <IconComponent size={iconSize} />}
        {children}
      </div>
    </button>
  );
}
