"use client";

import React from "react";

type CardVariant = "solid" | "dashed";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardElement = "div" | "section" | "article" | "aside";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: CardElement;
  children: React.ReactNode;
}

const cardVariants: Record<CardVariant, string> = {
  solid: "border border-black/10 dark:border-white/15",
  dashed: "border border-dashed border-black/20 dark:border-white/20",
};

const cardPaddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

export default function Card({
  variant = "solid",
  padding = "md",
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  const baseClasses = "rounded";
  const variantClasses = cardVariants[variant];
  const paddingClasses = cardPaddings[padding];

  const finalClasses = `${baseClasses} ${variantClasses} ${paddingClasses} ${className}`.trim();

  return (
    <Component className={finalClasses} {...props}>
      {children}
    </Component>
  );
}