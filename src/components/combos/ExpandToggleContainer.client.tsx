"use client";

import { PropsWithChildren, useState } from "react";
import ExpandToggle from "@/components/ui/ExpandToggle.client";

const ExpandToggleContainer = ({ children }: PropsWithChildren) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <ExpandToggle expanded={expanded} onToggle={setExpanded}>
      {children}
    </ExpandToggle>
  );
};
export default ExpandToggleContainer;
