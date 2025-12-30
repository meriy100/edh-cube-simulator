import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ActionCard from "./ActionCard.client";

// Sample icons for stories
const PoolIcon = () => (
  <svg
    className="w-6 h-6 text-blue-600 dark:text-blue-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14-3l2 3-2 3m-14 2l-2-3 2-3"
    />
  </svg>
);

const HomeIcon = () => (
  <svg
    className="w-6 h-6 text-green-600 dark:text-green-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    className="w-6 h-6 text-purple-600 dark:text-purple-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const meta: Meta<typeof ActionCard> = {
  title: "UI/ActionCard",
  component: ActionCard,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: {
      description: "The title of the action card",
      control: "text",
    },
    description: {
      description: "The description of what this action does",
      control: "text",
    },
    disabled: {
      description: "Whether the action is disabled",
      control: "boolean",
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
    title: "Pool管理",
    description: "作成されたPoolの管理と操作",
    onClick: () => console.log("Action clicked"),
  },
};

export const WithIcon: Story = {
  args: {
    title: "Pool管理",
    description: "作成されたPoolの管理と操作",
    icon: <PoolIcon />,
    onClick: () => console.log("Action clicked"),
  },
};

export const Disabled: Story = {
  args: {
    title: "メンテナンス中",
    description: "現在この機能はメンテナンス中です",
    icon: <RefreshIcon />,
    disabled: true,
    onClick: () => console.log("This should not trigger"),
  },
};

export const NonClickable: Story = {
  args: {
    title: "Information Card",
    description: "This card displays information only",
    icon: <HomeIcon />,
    // No onClick prop, so it's not clickable
  },
};

export const QuickActionsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <ActionCard
        title="Pool管理"
        description="作成されたPoolの管理と操作"
        icon={<PoolIcon />}
        onClick={() => console.log("Pool management")}
      />
      <ActionCard
        title="メインサイト"
        description="ユーザー向けメインページに移動"
        icon={<HomeIcon />}
        onClick={() => console.log("Main site")}
      />
      <ActionCard
        title="統計更新"
        description="最新の統計情報を取得"
        icon={<RefreshIcon />}
        onClick={() => console.log("Refresh stats")}
      />
    </div>
  ),
};

export const LongDescription: Story = {
  args: {
    title: "データベース管理",
    description:
      "データベースのバックアップ、復元、最適化などの高度な管理機能にアクセスします。この操作には管理者権限が必要です。",
    icon: <RefreshIcon />,
    onClick: () => console.log("Database management"),
  },
};
