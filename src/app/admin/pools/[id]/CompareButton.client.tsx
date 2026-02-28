"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button.client";
import Modal from "@/components/ui/Modal.client";
import Select from "@/components/ui/Select.client";
import { Pool } from "@/domain/entity/pool";

interface Props {
    currentPoolId: string;
    pools: Pool[];
}

export default function CompareButton({ currentPoolId, pools }: Props) {
    const [open, setOpen] = useState(false);
    const [targetPoolId, setTargetPoolId] = useState<string>("");
    const router = useRouter();

    // Exclude current pool from options and format for Select
    const options = pools
        .filter((p) => p.id !== currentPoolId)
        .map((p) => ({
            value: p.id,
            label: p.version || p.id,
        }));

    const handleOpen = () => {
        setOpen(true);
        if (options.length > 0 && options[0]) {
            setTargetPoolId(options[0].value);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCompare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetPoolId) return;

        setOpen(false);
        router.push(`/admin/pools/${currentPoolId}/compare/${targetPoolId}`);
    };

    return (
        <>
            <Button variant="secondary" onClick={handleOpen}>
                Compare
            </Button>

            <Modal open={open} onClose={handleClose} title="Select Pool to Compare">
                <form onSubmit={handleCompare} className="space-y-4">
                    <div>
                        <label htmlFor="target-pool" className="block text-sm font-medium mb-1">
                            Target Pool
                        </label>
                        <Select
                            id="target-pool"
                            fullWidth
                            value={targetPoolId}
                            onChange={(e) => setTargetPoolId(e.target.value)}
                            options={options}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!targetPoolId || options.length === 0}>
                            Compare
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
