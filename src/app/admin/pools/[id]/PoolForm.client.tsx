"use client";

import SectionCard from "@/components/ui/SectionCard";
import Input from "@/components/ui/Input.client";
import { startTransition, useState } from "react";
import { Pool } from "@/domain/entity/pool";
import Button from "@/components/ui/Button.client";
import { updatePoolAction } from "@/app/admin/pools/[id]/actions";

interface Props {
  pool: Pool;
}

const PoolForm = ({ pool }: Props) => {
  const [versionData, setVersionData] = useState(pool.version);

  const handleSubmit = async () => {
    startTransition(async () => {
      await updatePoolAction(pool.id, { version: versionData });
    });
  };

  return (
    <SectionCard title="Version">
      <div className="flex flex-row gap-2">
        <Input value={versionData} onChange={(e) => setVersionData(e.target.value)} />
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </SectionCard>
  );
};

export default PoolForm;
