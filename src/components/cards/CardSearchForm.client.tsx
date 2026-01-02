"use client";

import SectionCard from "@/components/ui/SectionCard";
import ManaSymbol from "@/components/ui/ManaSymbol.client";
import { useState } from "react";
import { Color, colorCompare, FULL_COLORS } from "@/domain/entity/card";
import { usePathname, useRouter } from "next/navigation";
import z from "zod";
import { cardSearchParamsSchema } from "@/components/cards/cardSearchParams";
import Button from "@/components/ui/Button.client";

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

  const handleColorChange = (color: Exclude<Color, "C">) => {
    const newColors = formData.c.includes(color)
      ? formData.c.filter((c) => c !== color)
      : [...formData.c, color].toSorted((a, b) => colorCompare(a) - colorCompare(b));

    setFormData({
      ...FormData,
      c: newColors,
    });

    const basePath = `/${pathname.split("/").slice(1, -1).join("/")}`;
    const c = newColors.join("").toLowerCase();
    router.push(`${basePath}/${c || "c"}`, {
      scroll: false,
    });
  };

  return (
    <SectionCard
      title="Search"
      className="sticky top-4 z-10 bg-gray-50 dark:bg-gray-900"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.scroll({ top: 0, behavior: "smooth" })}
        >
          Top
        </Button>
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
              onChange={() => handleColorChange(color)}
            />
            <ManaSymbol symbol={color.toLowerCase()} />
          </label>
        ))}
      </div>
    </SectionCard>
  );
};

export default CardSearchForm;
