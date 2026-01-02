"use client";

import Button from "@/components/ui/Button.client";
import { startTransition, useState } from "react";
import { publishPoolAction, revalidatePublishedPoolAction } from "@/app/admin/pools/[id]/actions";
import { Pool } from "@/domain/entity/pool";

interface Props {
  pool: Pool;
}

const PublishButton = ({ pool }: Props) => {
  const [disabled, setDisabled] = useState(false);

  const handleClick = async () => {
    setDisabled(true);
    startTransition(async () => {
      if (pool.published) {
        await revalidatePublishedPoolAction(pool.id);
      } else {
        await publishPoolAction(pool.id);
      }
    });
  };

  return (
    <Button disabled={disabled} onClick={handleClick}>
      {pool.published ? "Revalidate" : "Publish"}
    </Button>
  );
};

export default PublishButton;
