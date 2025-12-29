"use client";

import React from "react";
import Link from "next/link";

interface BackLinkProps {
  href: string;
  children?: React.ReactNode;
  className?: string;
}

export default function BackLink({
  href,
  children = "← Back",
  className = ""
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`text-sm underline cursor-pointer hover:opacity-80 ${className}`.trim()}
    >
      {children}
    </Link>
  );
}