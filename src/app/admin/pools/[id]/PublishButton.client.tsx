"use client";

import Button from "@/components/ui/Button.client";
import { startTransition } from "react";
import { publishPoolAction } from "@/app/admin/pools/[id]/actions";
import { Pool } from "@/domain/entity/pool";

interface Props {
  pool: Pool;
}

const PublishButton = ({ pool }: Props) => {
  const handleClick = async () => {
    startTransition(async () => {
      await publishPoolAction(pool.id);
    });
  };
  return <Button onClick={handleClick}>Publish</Button>;
};

export default PublishButton;
