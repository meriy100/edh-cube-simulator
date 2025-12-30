"use client";

import React, { useState } from "react";
import Button from "./Button.client";
import TagBadge from "./TagBadge.client";

interface TagInputProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClearTags: () => void;
  placeholder?: string;
  addButtonText?: string;
  clearButtonText?: string;
  emptyText?: string;
  className?: string;
}

export default function TagInput({
  selectedTags,
  onAddTag,
  onRemoveTag,
  onClearTags,
  placeholder = "#タグ名 を入力（# は省略可）",
  addButtonText = "タグを追加",
  clearButtonText = "すべてクリア",
  emptyText = "（未指定）",
  className = ""
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAddTag(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-2 mb-3"
      >
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="px-2 py-1 rounded border border-black/10 dark:border-white/20 bg-transparent text-sm"
        />
        <Button type="submit" size="sm" variant="primary">
          {addButtonText}
        </Button>
        {selectedTags.length > 0 && (
          <Button
            type="button"
            onClick={onClearTags}
            variant="ghost"
            size="sm"
            className="ml-auto text-xs opacity-80 hover:opacity-100"
          >
            {clearButtonText}
          </Button>
        )}
      </form>
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 && (
          <div className="text-sm opacity-70">{emptyText}</div>
        )}
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag}
            variant="removable"
            onRemove={() => onRemoveTag(tag)}
          >
            {tag}
          </TagBadge>
        ))}
      </div>
    </div>
  );
}