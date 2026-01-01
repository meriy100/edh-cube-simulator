"use client";

import { Combo } from "@/domain/entity/combo";
import Button from "@/components/ui/Button.client";
import { startTransition, useState } from "react";
import { translateCombosAction } from "@/app/admin/pools/[id]/combos/actions";

interface Props {
  combos: Combo[];
}
const TranslateButton = ({ combos }: Props) => {
  const [disabled, setDisabled] = useState(false);

  const handleClick = async () => {
    setDisabled(true);
    startTransition(async () => {
      await translateCombosAction(combos);
    });
  };

  return (
    <Button disabled={disabled} onClick={handleClick}>
      Translate
    </Button>
  );
};

export default TranslateButton;
