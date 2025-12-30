import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SectionCard from "./SectionCard";
import Button from "./Button";
import ListItem from "./ListItem";
import TagInput from "./TagInput";
import { useState } from "react";

const meta: Meta<typeof SectionCard> = {
  title: "UI/SectionCard",
  component: SectionCard,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: {
      description: "The title of the section",
      control: "text",
    },
    subtitle: {
      description: "Optional subtitle or description",
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

export const Default: Story = {
  args: {
    title: "フィルター条件",
    children: <div className="text-sm opacity-70">Content goes here</div>,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Commanders",
    subtitle: "3 cards found",
    children: <div className="text-sm opacity-70">Content goes here</div>,
  },
};

export const WithActions: Story = {
  args: {
    title: "Seat1",
    actions: (
      <Button variant="danger" size="sm">
        Export
      </Button>
    ),
    children: <div className="text-sm opacity-70">Content goes here</div>,
  },
};

export const FilterSection: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<string[]>([
      "#2-targeted-disruption",
      "#commander",
    ]);

    const handleAddTag = (tag: string) => {
      const normalized = tag.startsWith("#") ? tag : `#${tag}`;
      if (!selectedTags.includes(normalized)) {
        setSelectedTags([...selectedTags, normalized]);
      }
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

    const handleClearTags = () => {
      setSelectedTags([]);
    };

    return (
      <SectionCard title="フィルター条件">
        <TagInput
          selectedTags={selectedTags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClearTags={handleClearTags}
        />
      </SectionCard>
    );
  },
};

export const PoolsSection: Story = {
  render: () => (
    <SectionCard title="Pools">
      <div className="flex flex-col gap-2">
        <ListItem
          title="EDH Cube 2024"
          subtitle="cards: 360"
          metadata="2024/12/29 10:30:00"
          actions={
            <>
              <Button variant="danger">Show</Button>
              <Button variant="danger">Delete</Button>
            </>
          }
        />
        <ListItem
          title="(untitled)"
          subtitle="cards: 180"
          metadata="2024/12/28 15:45:00"
          actions={
            <>
              <Button variant="danger">Show</Button>
              <Button variant="danger">Delete</Button>
            </>
          }
        />
      </div>
    </SectionCard>
  ),
};

export const DraftsSection: Story = {
  render: () => (
    <SectionCard title="Drafts">
      <div className="flex flex-col gap-2">
        <ListItem
          title="EDH Cube 2024"
          metadata="2024/12/29 10:30:00 / seat 8"
          actions={
            <>
              <Button variant="danger">Open</Button>
              <Button variant="danger">Delete</Button>
            </>
          }
        />
        <ListItem
          title="Vintage Cube"
          metadata="2024/12/28 15:45:00 / seat 6"
          actions={
            <>
              <Button variant="danger">Open</Button>
              <Button variant="danger">Delete</Button>
            </>
          }
        />
      </div>
    </SectionCard>
  ),
};

export const SeatSection: Story = {
  args: {
    title: "Seat1",
    actions: (
      <Button variant="danger" size="sm">
        Export
      </Button>
    ),
    children: (
      <div className="text-sm opacity-70">Picked cards and board would be displayed here</div>
    ),
  },
};
