"use client";

import React from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className = ""
}: SectionCardProps) {
  return (
    <section className={`border border-black/10 dark:border-white/15 rounded p-3 ${className}`.trim()}>
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <div className="text-sm opacity-70 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}