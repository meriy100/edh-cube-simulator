"use client";

import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button.client";
import ManaSymbol from "@/components/ui/ManaSymbol.client";
import { useState } from "react";
import { Color, colorCompare, FULL_COLORS } from "@/domain/entity/card";
import { usePathname, useRouter } from "next/navigation";
import z from "zod";
import { cardSearchParamsSchema } from "@/components/cards/cardSearchParams";

interface FormData {
  c: Exclude<Color, "C">[];
}

interface Props {
  q: z.infer<typeof cardSearchParamsSchema>;
}

const CardSearchForm = ({ q }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [formData, setFormData] = useState<FormData>(q);

  const handleSubmit = () => {
    const basePath = `/${pathname.split("/").slice(1, -1).join("/")}`;
    const c = formData.c.join("").toLowerCase();
    router.push(`${basePath}/${c || "c"}`);
  };

  const handleClear = () => {
    setFormData({ c: FULL_COLORS });
    router.push(pathname);
  };

  return (
    <SectionCard
      title="Search"
      footerActions={
        <div className="flex flex-row gap-2">
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSubmit}>Search</Button>
        </div>
      }
    >
      <div className="flex flex-row gap-4">
        {FULL_COLORS.map((color) => (
          <label
            key={color}
            htmlFor={color}
            className="
              inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer text-xl
              border-2 transition-all duration-200
              border-transparent bg-gray-300 opacity-50 grayscale
              has-[:checked]:border-gray-800 has-[:checked]:bg-white has-[:checked]:opacity-100 has-[:checked]:grayscale-0
              has-[:checked]:shadow-[0_0_8px_rgba(0,0,0,0.2)]
            "
          >
            <input
              id={color}
              type="checkbox"
              checked={formData.c?.includes(color) ?? true}
              className="sr-only peer"
              onChange={() => {
                setFormData((prev) => {
                  return {
                    ...prev,
                    c: (formData.c ?? []).includes(color)
                      ? (prev.c ?? []).filter((c) => c !== color)
                      : [...(prev.c ?? []), color].toSorted(
                          (a, b) => colorCompare(a) - colorCompare(b),
                        ),
                  };
                });
              }}
            />
            <ManaSymbol symbol={color.toLowerCase()} />
          </label>
        ))}
      </div>
    </SectionCard>
  );
};

export default CardSearchForm;
