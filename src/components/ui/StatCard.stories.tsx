import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StatCard from "./StatCard";

// Sample icons for stories
const PoolIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14-3l2 3-2 3m-14 2l-2-3 2-3"
    />
  </svg>
);

const DraftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const CardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14-3v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v3z"
    />
  </svg>
);

const meta: Meta<typeof StatCard> = {
  title: "UI/StatCard",
  component: StatCard,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: {
      description: "The title of the stat card",
      control: "text",
    },
    value: {
      description: "The main statistical value to display",
      control: "text",
    },
    subtitle: {
      description: "Optional subtitle with additional information",
      control: "text",
    },
    color: {
      description: "Color theme for the icon background",
      control: "select",
      options: ["blue", "green", "purple", "red", "yellow"],
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
    title: "Pools",
    value: 42,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Pools",
    value: 42,
    subtitle: "過去7日間: 5個",
  },
};

export const WithIcon: Story = {
  args: {
    title: "Pools",
    value: 42,
    subtitle: "過去7日間: 5個",
    icon: <PoolIcon />,
    color: "blue",
  },
};

export const Green: Story = {
  args: {
    title: "Drafts",
    value: 128,
    subtitle: "過去7日間: 12個",
    icon: <DraftIcon />,
    color: "green",
  },
};

export const Purple: Story = {
  args: {
    title: "Cards",
    value: "1,234",
    subtitle: "ユニークカード数",
    icon: <CardIcon />,
    color: "purple",
  },
};

export const GridExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
      <StatCard
        title="Pools"
        value={42}
        subtitle="過去7日間: 5個"
        icon={<PoolIcon />}
        color="blue"
      />
      <StatCard
        title="Drafts"
        value={128}
        subtitle="過去7日間: 12個"
        icon={<DraftIcon />}
        color="green"
      />
      <StatCard
        title="Cards"
        value="1,234"
        subtitle="ユニークカード数"
        icon={<CardIcon />}
        color="purple"
      />
    </div>
  ),
};
