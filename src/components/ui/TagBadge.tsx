"use client";

import React from "react";

type TagBadgeVariant = "default" | "clickable" | "removable";
type TagBadgeSize = "sm" | "md";

interface TagBadgeProps {
  children: React.ReactNode;
  variant?: TagBadgeVariant;
  size?: TagBadgeSize;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  title?: string;
}

const sizeClasses: Record<TagBadgeSize, string> = {
  sm: "text-[11px] px-1.5 py-0.5",
  md: "text-[12px] px-2 py-1",
};

export default function TagBadge({
  children,
  variant = "default",
  size = "md",
  onClick,
  onRemove,
  className = "",
  title
}: TagBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 rounded bg-black/5 dark:bg-white/10";
  const sizeClass = sizeClasses[size];

  if (variant === "removable" && onRemove) {
    return (
      <span
        className={`${baseClasses} ${sizeClass} ${className}`.trim()}
        title={title}
      >
        {children}
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-1 hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer"
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      </span>
    );
  }

  if (variant === "clickable" && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${sizeClass} hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer ${className}`.trim()}
        title={title}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={`${baseClasses} ${sizeClass} ${className}`.trim()}
      title={title}
    >
      {children}
    </span>
  );
}