"use client";

import React from "react";

type LinkVariant = "default" | "danger" | "nav" | "outlined" | "action-blue" | "action-green" | "action-red";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkVariant;
  children: React.ReactNode;
  href: string;
  disabled?: boolean;
}

const linkVariants: Record<LinkVariant, string> = {
  default: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
  danger: "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300",
  nav: "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors",
  outlined: "text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md font-medium transition-colors border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
  "action-blue": "text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300",
  "action-green": "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300",
  "action-red": "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300",
};

export default function Link({
  variant = "default",
  className = "",
  disabled = false,
  children,
  href,
  onClick,
  ...props
}: LinkProps) {
  const baseClasses = "cursor-pointer transition-colors focus:outline-none";
  const variantClasses = linkVariants[variant];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  // For variants that already include their own styling (nav, outlined), don't add underline and text-sm
  const isStyledVariant = variant === "nav" || variant === "outlined";
  const underlineClasses = isStyledVariant ? "" : "text-sm underline";

  // Nav variant doesn't need focus ring, other variants do
  const focusRingClasses = variant === "nav" ? "" : "focus:ring-2 focus:ring-offset-2";

  const finalClasses = disabled
    ? `${baseClasses} ${underlineClasses} ${focusRingClasses} ${variantClasses} opacity-60 cursor-not-allowed ${className}`.trim()
    : `${baseClasses} ${underlineClasses} ${focusRingClasses} ${variantClasses} ${className}`.trim();

  return (
    <a
      className={finalClasses}
      href={disabled ? undefined : href}
      onClick={handleClick}
      {...(disabled ? { "aria-disabled": true } : {})}
      {...props}
    >
      {children}
    </a>
  );
}