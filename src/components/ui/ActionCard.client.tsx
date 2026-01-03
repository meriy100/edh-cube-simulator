"use client";

import Link from "next/link";
import React, { ComponentProps, ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  href?: ComponentProps<typeof Link>["href"];
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ActionCard = ({
  title,
  description,
  icon,
  onClick,
  href,
  disabled = false,
  className = "",
}: ActionCardProps) => {
  const baseClassName = "p-4 text-left rounded-lg border dark:border-gray-600 transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClassName} block focus:outline-none focus:ring-1 focus:ring-offset-1 ${className}`.trim()}
        passHref
      >
        <Children icon={icon} title={title} description={description} />
      </Link>
    );
  }

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`${baseClassName} ${
        onClick && !disabled ? "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`.trim()}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <Children icon={icon} title={title} description={description} />
    </Component>
  );
};

export default ActionCard;

const Children = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3">
    {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      ) : null}
    </div>
  </div>
);
