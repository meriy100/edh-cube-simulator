import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Card from "./Card";
import Button from "./Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "dashed"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This is a basic card with default solid border and medium padding.
        </p>
      </div>
    ),
  },
};

export const Dashed: Story = {
  args: {
    variant: "dashed",
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Dashed Card</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This card has a dashed border, perfect for drop zones or placeholder areas.
        </p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: "none",
    children: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">No Padding Card</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This card has no default padding, so you can control the spacing yourself.
        </p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: "sm",
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Small Padding</h3>
        <p className="text-gray-600 dark:text-gray-400">Compact card with small padding.</p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: "lg",
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Large Padding</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Spacious card with large padding, great for important content.
        </p>
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Card with Actions</h3>
          <Button variant="link" size="sm">
            Edit
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This card demonstrates how you might include action buttons in the header.
        </p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Save
          </Button>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </div>
      </div>
    ),
  },
};

export const DropZone: Story = {
  args: {
    variant: "dashed",
    padding: "lg",
    className: "text-center min-h-32 flex items-center justify-center",
    children: (
      <div className="text-gray-500 dark:text-gray-400">
        <div className="text-2xl mb-2">📁</div>
        <p>Drop files here</p>
        <p className="text-sm">or click to browse</p>
      </div>
    ),
  },
};

export const StatCard: Story = {
  args: {
    children: (
      <div className="text-center">
        <div className="text-3xl font-bold text-emerald-600 mb-1">42</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Total Cards
        </div>
      </div>
    ),
  },
};
