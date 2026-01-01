"use client";

import React, { useRef, useState } from "react";

type FileInputSize = "sm" | "md" | "lg";

interface FileInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  fieldSize?: FileInputSize;
  error?: boolean;
  fullWidth?: boolean;
  dragAndDrop?: boolean;
  multiple?: boolean;
  accept?: string;
  onFilesSelect?: (files: FileList) => void;
}

const inputSizes: Record<FileInputSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

const dragSizes: Record<FileInputSize, string> = {
  sm: "p-4 text-xs",
  md: "p-6 text-sm",
  lg: "p-8 text-base",
};

export default function FileInput({
  fieldSize = "md",
  error = false,
  fullWidth = false,
  dragAndDrop = false,
  multiple = false,
  accept,
  onFilesSelect,
  className = "",
  disabled,
  ...props
}: FileInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = dragAndDrop ? dragSizes[fieldSize] : inputSizes[fieldSize];
  const widthClasses = fullWidth ? "w-full" : "";
  const errorClasses = error
    ? "border-red-300 dark:border-red-700 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500";
  const disabledClasses = disabled
    ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      onFilesSelect?.(files);
    }
    props.onChange?.(event);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files && inputRef.current) {
      // Create a new FileList-like object for the input
      inputRef.current.files = files;
      setSelectedFiles(Array.from(files));
      onFilesSelect?.(files);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  if (dragAndDrop) {
    const dragClasses = isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "";
    const baseClasses =
      "rounded-md border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center";

    return (
      <div
        className={`${baseClasses} ${sizeClasses} ${widthClasses} ${errorClasses} ${disabledClasses} ${dragClasses} ${className}`.trim()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
          {...props}
        />

        <svg
          className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <div className="text-center">
          <p className="font-medium">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
              : "Click to upload or drag and drop"}
          </p>
          {selectedFiles.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {selectedFiles.map((file) => file.name).join(", ")}
            </p>
          )}
          {accept && (
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">Accepted: {accept}</p>
          )}
        </div>
      </div>
    );
  }

  const baseClasses = "rounded-md focus:outline-none focus:ring-2 border transition-colors";

  return (
    <div className={widthClasses}>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className={`${baseClasses} ${sizeClasses} ${widthClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
        {...props}
      />
      {selectedFiles.length > 0 && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Selected: {selectedFiles.map((file) => file.name).join(", ")}
        </div>
      )}
    </div>
  );
}
