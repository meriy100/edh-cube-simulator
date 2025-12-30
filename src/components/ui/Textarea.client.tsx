"use client";

import React from "react";

type TextareaSize = "sm" | "md" | "lg" | "xl";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  monospace?: boolean;
  error?: boolean;
}

const textareaSizes: Record<TextareaSize, string> = {
  sm: "min-h-24 h-24",
  md: "min-h-32 h-32",
  lg: "min-h-48 h-48",
  xl: "min-h-72 h-72",
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = "md", monospace = false, error = false, className = "", ...props }, ref) => {
    const baseClasses =
      "w-full p-3 rounded border bg-transparent text-sm resize-y focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const sizeClasses = textareaSizes[size];
    const fontClasses = monospace ? "font-mono" : "";
    const borderClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-black/10 dark:border-white/20 focus:border-blue-500 focus:ring-blue-500";

    const finalClasses =
      `${baseClasses} ${sizeClasses} ${fontClasses} ${borderClasses} ${className}`.trim();

    return <textarea ref={ref} className={finalClasses} {...props} />;
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
