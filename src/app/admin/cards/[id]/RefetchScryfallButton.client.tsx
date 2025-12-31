"use client";

import Button from "@/components/ui/Button.client";
import { RefreshCw } from "lucide-react";
import { fetchScryfall } from "@/lib/scryfall";
import { startTransition, useState } from "react";
import { newCardId } from "@/domain/entity/card";
import { updateCardAction } from "@/app/admin/cards/[id]/actions";

interface Props {
  name: string;
}

const RefetchScryfallButton = ({ name }: Props) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleClick = async () => {
    setIsFetching(true);
    const data = await fetchScryfall(name);
    console.log(data);
    startTransition(async () => {
      await updateCardAction(newCardId(name), {
        scryfall: data.en,
        scryfallJa: data.ja,
      });
      setIsFetching(false);
    });
  };

  return (
    <Button icon={RefreshCw} disabled={isFetching} onClick={handleClick}>
      Scryfall
    </Button>
  );
};

export default RefetchScryfallButton;
