"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <PageHeader title="EDH Cube Draft Simulator" />
    </div>
  );
}
