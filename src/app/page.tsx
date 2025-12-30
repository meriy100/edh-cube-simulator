"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    fetch("/api/pools");
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <PageHeader title="EDH Cube Draft Simulator" />
    </div>
  );
}
