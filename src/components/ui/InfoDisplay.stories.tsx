import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InfoDisplay from "./InfoDisplay";

const meta: Meta<typeof InfoDisplay> = {
  title: "UI/InfoDisplay",
  component: InfoDisplay,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: {
      description: "The label to display before the colon",
      control: "text",
    },
    children: {
      description: "The content to display after the label",
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
    label: "Name",
    children: "Magic: The Gathering",
  },
};

export const WithNumber: Story = {
  args: {
    label: "Cards",
    children: 1234,
  },
};

export const WithMultipleWords: Story = {
  args: {
    label: "Set Name",
    children: "Modern Horizons 3",
  },
};

export const WithLongLabel: Story = {
  args: {
    label: "Release Date",
    children: "June 14, 2024",
  },
};

export const WithReactNode: Story = {
  args: {
    label: "Status",
    children: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
        Active
      </span>
    ),
  },
};

export const List: Story = {
  render: () => (
    <dl className="space-y-2">
      <InfoDisplay label="Name">Duskmourn: House of Horror</InfoDisplay>
      <InfoDisplay label="Code">DSK</InfoDisplay>
      <InfoDisplay label="Release Date">September 27, 2024</InfoDisplay>
      <InfoDisplay label="Type">Expansion</InfoDisplay>
      <InfoDisplay label="Cards">
        <span className="font-medium">287</span>
      </InfoDisplay>
      <InfoDisplay label="Status">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          Released
        </span>
      </InfoDisplay>
    </dl>
  ),
};

export const CardLayout: Story = {
  render: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Card Information
      </h3>
      <dl className="space-y-3">
        <InfoDisplay label="Name">Lightning Bolt</InfoDisplay>
        <InfoDisplay label="Mana Cost">{"{R}"}</InfoDisplay>
        <InfoDisplay label="Type">Instant</InfoDisplay>
        <InfoDisplay label="Power/Toughness">—</InfoDisplay>
        <InfoDisplay label="Rarity">Common</InfoDisplay>
        <InfoDisplay label="Text">
          Lightning Bolt deals 3 damage to any target.
        </InfoDisplay>
      </dl>
    </div>
  ),
};