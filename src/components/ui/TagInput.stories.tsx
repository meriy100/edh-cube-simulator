import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import TagInput from "./TagInput";

const meta: Meta<typeof TagInput> = {
  title: "UI/TagInput",
  component: TagInput,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    placeholder: {
      description: "Placeholder text for the input field",
      control: "text",
    },
    addButtonText: {
      description: "Text for the add button",
      control: "text",
    },
    clearButtonText: {
      description: "Text for the clear all button",
      control: "text",
    },
    emptyText: {
      description: "Text to show when no tags are selected",
      control: "text",
    },
    className: {
      description: "Additional CSS classes",
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to normalize tags (add # prefix if not present)
const normalizeTag = (tag: string): string | null => {
  const trimmed = tag.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

export const Default: Story = {
  render: (args) => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleAddTag = (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      if (selectedTags.includes(normalized)) return;
      setSelectedTags([...selectedTags, normalized]);
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleClearTags = () => {
      setSelectedTags([]);
    };

    return (
      <TagInput
        {...args}
        selectedTags={selectedTags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onClearTags={handleClearTags}
      />
    );
  },
};

export const WithInitialTags: Story = {
  render: (args) => {
    const [selectedTags, setSelectedTags] = useState<string[]>([
      "#2-targeted-disruption",
      "#9-1-R",
      "#commander"
    ]);

    const handleAddTag = (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      if (selectedTags.includes(normalized)) return;
      setSelectedTags([...selectedTags, normalized]);
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleClearTags = () => {
      setSelectedTags([]);
    };

    return (
      <TagInput
        {...args}
        selectedTags={selectedTags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onClearTags={handleClearTags}
      />
    );
  },
};

export const English: Story = {
  render: (args) => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleAddTag = (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      if (selectedTags.includes(normalized)) return;
      setSelectedTags([...selectedTags, normalized]);
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleClearTags = () => {
      setSelectedTags([]);
    };

    return (
      <TagInput
        {...args}
        selectedTags={selectedTags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onClearTags={handleClearTags}
        placeholder="Enter tag name (# prefix optional)"
        addButtonText="Add Tag"
        clearButtonText="Clear All"
        emptyText="(No tags selected)"
      />
    );
  },
};

export const InSection: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<string[]>([
      "#2-targeted-disruption",
      "#commander"
    ]);

    const handleAddTag = (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      if (selectedTags.includes(normalized)) return;
      setSelectedTags([...selectedTags, normalized]);
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleClearTags = () => {
      setSelectedTags([]);
    };

    return (
      <section className="border border-black/10 dark:border-white/15 rounded p-3 max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">フィルター条件</h2>
        <TagInput
          selectedTags={selectedTags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClearTags={handleClearTags}
        />
      </section>
    );
  },
};