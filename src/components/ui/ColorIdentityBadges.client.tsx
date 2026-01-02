"use client";

import TagBadge from "./TagBadge.client";
import { Color } from "@/domain/entity/card";
import ManaSymbol from "@/components/ui/ManaSymbol.client";
import { ComponentProps } from "react";

interface Props {
  colorIdentity: Color[];
  size?: ComponentProps<typeof ManaSymbol>["size"];
  className?: string;
}

const colorConfig: Record<Color, { symbol: string; bgColor: string; textColor: string }> = {
  W: {
    symbol: "w",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    textColor: "text-yellow-800 dark:text-yellow-200",
  },
  U: {
    symbol: "u",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-800 dark:text-blue-200",
  },
  B: {
    symbol: "b",
    bgColor: "bg-gray-800 dark:bg-gray-200",
    textColor: "text-white dark:text-gray-800",
  },
  R: {
    symbol: "r",
    bgColor: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-800 dark:text-red-200",
  },
  G: {
    symbol: "g",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-800 dark:text-green-200",
  },
  C: {
    symbol: "c",
    bgColor: "bg-cyan-100 dark:bg-cyan-900",
    textColor: "text-cyan-800 dark:text-cyan-200",
  },
};

const ColorIdentityBadges = ({ colorIdentity, size, className = "" }: Props) => {
  if (colorIdentity.length === 0) {
    return (
      <div className={className}>
        <TagBadge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Colorless
        </TagBadge>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`.trim()}>
      {colorIdentity.map((color) => {
        const config = colorConfig[color];
        return <ManaSymbol key={color} symbol={config.symbol} size={size} />;
      })}
    </div>
  );
};

export default ColorIdentityBadges;
