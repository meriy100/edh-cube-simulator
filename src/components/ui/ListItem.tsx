"use client";

import React from "react";

interface ListItemProps {
  title: string;
  subtitle?: string;
  metadata?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ListItem({
  title,
  subtitle,
  metadata,
  actions,
  onClick,
  className = ""
}: ListItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 border border-black/10 dark:border-white/15 rounded p-2 ${
        onClick ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : ""
      } ${className}`.trim()}
    >
      <div className="flex-1">
        <div className="font-medium">
          {title}
          {metadata && (
            <span className="opacity-70 text-xs ml-2">
              {metadata}
            </span>
          )}
        </div>
        {subtitle && <div className="opacity-70 text-xs">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </Component>
  );
}