import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ExpandToggle from "./ExpandToggle.client";
import SectionCard from "./SectionCard";
import { useState } from "react";

const meta: Meta<typeof ExpandToggle> = {
  title: "UI/ExpandToggle",
  component: ExpandToggle,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    expanded: {
      description: "Whether the content is expanded",
      control: "boolean",
    },
    onToggle: {
      description: "Callback function called when toggle is clicked",
      action: "toggled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);

    return (
      <ExpandToggle expanded={expanded} onToggle={setExpanded}>
        <div className="text-sm opacity-70 mt-2">
          This content is shown when expanded. It can contain any React elements.
        </div>
      </ExpandToggle>
    );
  },
};

export const Expanded: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(true);

    return (
      <ExpandToggle expanded={expanded} onToggle={setExpanded}>
        <div className="text-sm opacity-70 mt-2">
          This content is visible by default because expanded is initially true.
        </div>
      </ExpandToggle>
    );
  },
};

export const WithSectionCard: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);

    return (
      <SectionCard
        title="Filter Options"
        actions={<ExpandToggle expanded={expanded} onToggle={setExpanded} />}
      >
        {expanded && (
          <div className="text-sm opacity-70">
            Advanced filter options would be displayed here when expanded.
          </div>
        )}
      </SectionCard>
    );
  },
};

export const MultipleContent: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);

    return (
      <ExpandToggle expanded={expanded} onToggle={setExpanded}>
        <div className="flex flex-col gap-2 mt-2">
          <div className="text-sm font-medium">Multiple content blocks:</div>
          <div className="text-sm opacity-70">First item</div>
          <div className="text-sm opacity-70">Second item</div>
          <div className="text-sm opacity-70">Third item</div>
        </div>
      </ExpandToggle>
    );
  },
};
