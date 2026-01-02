"use client";

import React, { ComponentProps } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: LucideIcon;
}

export interface ButtonAsButtonProps
  extends
    BaseButtonProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  href?: never;
}

export interface ButtonAsLinkProps
  extends BaseButtonProps, Omit<ComponentProps<typeof Link>, keyof BaseButtonProps> {
  href: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

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
    "bg-red-600 text-white border-red-700 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300",
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
  children,
  icon,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-block rounded font-semibold border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed text-center no-underline";

  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];

  const finalClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  const IconComponent = icon;
  const iconSize = iconSizes[size];

  const content = (
    <div className="flex items-center justify-center gap-2">
      {IconComponent && <IconComponent size={iconSize} />}
      {children}
    </div>
  );

  // If href is provided, render as Link
  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={finalClasses} {...linkProps}>
        {content}
      </Link>
    );
  }

  // Otherwise, render as button
  const { disabled, ...buttonProps } = props as ButtonAsButtonProps;
  return (
    <button className={finalClasses} disabled={disabled} {...buttonProps}>
      {content}
    </button>
  );
}
