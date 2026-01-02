"use client";

import { useState } from "react";
import FileInput from "@/components/ui/FileInput.client";
import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button.client";
import Alert from "@/components/ui/Alert.client";
import LoadingSpinner from "@/components/ui/LoadingSpinner.client";
import { useRouter } from "next/navigation";
import semver from "semver/preload";

interface Props {
  latestVersion: string;
}

const NewPoolForm = ({ latestVersion }: Props) => {
  const [file, setFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleFilesSelect = (files: FileList) => {
    setFile(files[0]);
    setError(undefined);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const version =
        semver.inc(semver.valid(latestVersion) ?? "0.0.1", "prerelease", "rc") ?? "0.0.1";
      formData.append("version", version);

      const response = await fetch("/api/admin/pools", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload CSV");
      }

      setFile(undefined);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      if (data.id) {
        router.push(`/admin/pools/${data.id}`);
      }
    } catch (err) {
      console.error("Error uploading CSV:", err);
      setError(err instanceof Error ? err.message : "Failed to upload CSV file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Pool 登録"
      subtitle="Cube cobra の CSV から Pool を登録"
      footerActions={
        <Button
          variant="primary"
          disabled={file === undefined || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Uploading...
            </div>
          ) : (
            "Submit"
          )}
        </Button>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <FileInput dragAndDrop fieldSize="lg" accept=".csv" onFilesSelect={handleFilesSelect} />
      </div>
    </SectionCard>
  );
};

export default NewPoolForm;
