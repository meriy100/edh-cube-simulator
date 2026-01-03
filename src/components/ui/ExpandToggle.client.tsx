"use client";

import { PropsWithChildren } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  expanded: boolean;
  onToggle: (v: boolean) => void;
}

const ExpandToggle = ({ expanded, onToggle, children }: PropsWithChildren<Props>) => {
  return (
    <>
      <button
        className="flex items-center justify-start h-6 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-150 cursor-pointer"
        onClick={() => onToggle(!expanded)}
        aria-label={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-black/70 dark:text-white/70" />
        ) : (
          <ChevronRight className="w-4 h-4 text-black/70 dark:text-white/70" />
        )}
      </button>
      {expanded && children}
    </>
  );
};

export default ExpandToggle;
