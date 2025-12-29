import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TagBadge from "./TagBadge";

const meta: Meta<typeof TagBadge> = {
  title: "UI/TagBadge",
  component: TagBadge,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    children: {
      description: "The tag content",
      control: "text",
    },
    variant: {
      description: "The interaction behavior of the tag",
      control: "select",
      options: ["default", "clickable", "removable"],
    },
    size: {
      description: "The size of the tag",
      control: "select",
      options: ["sm", "md"],
    },
    title: {
      description: "Tooltip text",
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
    children: "#2-targeted-disruption",
  },
};

export const Small: Story = {
  args: {
    children: "#9-1-R",
    size: "sm",
  },
};

export const Clickable: Story = {
  args: {
    children: "#2-targeted-disruption",
    variant: "clickable",
    title: "#2-targeted-disruption でフィルター",
    onClick: () => alert("Tag clicked!"),
  },
};

export const Removable: Story = {
  args: {
    children: "#2-targeted-disruption",
    variant: "removable",
    onRemove: () => alert("Tag removed!"),
  },
};

export const TagGroup: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TagBadge variant="removable" onRemove={() => console.log("Removed")}>
        #2-targeted-disruption
      </TagBadge>
      <TagBadge variant="removable" onRemove={() => console.log("Removed")}>
        #9-1-R
      </TagBadge>
      <TagBadge variant="removable" onRemove={() => console.log("Removed")}>
        #commander
      </TagBadge>
    </div>
  ),
};

export const FilterTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-1">
      <TagBadge variant="clickable" size="sm" onClick={() => console.log("Clicked")}>
        #2-targeted-disruption
      </TagBadge>
      <TagBadge variant="clickable" size="sm" onClick={() => console.log("Clicked")}>
        #9-1-R
      </TagBadge>
      <TagBadge variant="clickable" size="sm" onClick={() => console.log("Clicked")}>
        #commander
      </TagBadge>
      <TagBadge variant="clickable" size="sm" onClick={() => console.log("Clicked")}>
        #combo-piece
      </TagBadge>
    </div>
  ),
};
