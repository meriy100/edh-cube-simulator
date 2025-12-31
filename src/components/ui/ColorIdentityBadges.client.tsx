"use client";

import TagBadge from "./TagBadge.client";
import { Color } from "@/domain/entity/card";

interface ColorIdentityBadgesProps {
  colorIdentity: Color[];
  className?: string;
}

const colorConfig: Record<Color, { name: string; bgColor: string; textColor: string }> = {
  W: {
    name: "W",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    textColor: "text-yellow-800 dark:text-yellow-200",
  },
  U: {
    name: "U",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-800 dark:text-blue-200",
  },
  B: {
    name: "B",
    bgColor: "bg-gray-800 dark:bg-gray-200",
    textColor: "text-white dark:text-gray-800",
  },
  R: {
    name: "R",
    bgColor: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-800 dark:text-red-200",
  },
  G: {
    name: "G",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-800 dark:text-green-200",
  },
  C: {
    name: "C",
    bgColor: "bg-cyan-100 dark:bg-cyan-900",
    textColor: "text-cyan-800 dark:text-cyan-200",
  },
};

const ColorIdentityBadges = ({ colorIdentity, className = "" }: ColorIdentityBadgesProps) => {
  if (!colorIdentity || colorIdentity.length === 0) {
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
        return (
          <TagBadge
            key={color}
            className={`${config.bgColor} ${config.textColor}`}
            title={`${config.name === "W" ? "White" : config.name === "U" ? "Blue" : config.name === "B" ? "Black" : config.name === "R" ? "Red" : "Green"}`}
          >
            {config.name}
          </TagBadge>
        );
      })}
    </div>
  );
};

export default ColorIdentityBadges;
