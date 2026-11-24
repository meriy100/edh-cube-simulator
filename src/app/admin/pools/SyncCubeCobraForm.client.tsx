"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button.client";
import Alert from "@/components/ui/Alert.client";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import Link from "@/components/ui/Link.client";
import { syncCubeCobraAction } from "@/app/admin/pools/actions";

interface Props {
  cubeUrl: string;
  nextVersion: string;
}

const SyncCubeCobraForm = ({ cubeUrl, nextVersion }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleClick = () => {
    setError(undefined);
    startTransition(async () => {
      // Redirects to the new pool on success; returns only on failure.
      const result = await syncCubeCobraAction();
      setError(result.error);
    });
  };

  return (
    <SectionCard
      title="CubeCobra から同期"
      subtitle={`CubeCobra の最新の内容で新しいバージョン (v${nextVersion}) の Pool を作成します`}
      footerActions={
        <Button
          variant="primary"
          icon={isPending ? undefined : RefreshCw}
          disabled={isPending}
          onClick={handleClick}
        >
          {isPending ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Syncing...
            </div>
          ) : (
            "同期"
          )}
        </Button>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Link href={cubeUrl} target="_blank" rel="noopener noreferrer">
          {cubeUrl}
        </Link>
      </div>
    </SectionCard>
  );
};

export default SyncCubeCobraForm;
