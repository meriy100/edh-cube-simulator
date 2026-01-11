"use client";

import { useTransition } from "react";
import Button from "@/components/ui/Button.client";
import { toggleUnlistedAction } from "@/app/admin/pools/[id]/combos/actions";

interface Props {
    poolId: string;
    poolXComboId: string;
    unlisted: boolean;
}

const UnlistedToggleButton = ({ poolId, poolXComboId, unlisted }: Props) => {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            await toggleUnlistedAction(poolId, poolXComboId, unlisted);
        });
    };

    return (
        <Button
            variant={unlisted ? "secondary" : "danger"}
            size="sm"
            onClick={handleClick}
            disabled={isPending}
        >
            {unlisted ? "Listed" : "Unlisted"}
        </Button>
    );
};

export default UnlistedToggleButton;
