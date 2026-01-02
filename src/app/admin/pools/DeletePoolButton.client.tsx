"use client";

import { PoolId } from "@/domain/entity/pool";
import { deletePoolAction } from "@/app/admin/pools/actions";
import { startTransition, useState } from "react";
import Button from "@/components/ui/Button.client";

interface Props {
  id: PoolId;
}

const DeletePoolButton = ({ id }: Props) => {
  const [disabled, setDisabled] = useState(false);

  const handleClick = async () => {
    setDisabled(true);
    startTransition(async () => {
      await deletePoolAction(id);
    });
  };

  return (
    <Button variant="danger" disabled={disabled} onClick={handleClick}>
      Delete
    </Button>
  );
};

export default DeletePoolButton;
