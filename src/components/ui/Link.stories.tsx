import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "./Link.client";

const meta: Meta<typeof Link> = {
  title: "UI/Link",
  component: Link,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "danger", "nav", "outlined", "action-blue", "action-green", "action-red"],
    },
    disabled: {
      control: "boolean",
    },
    href: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    href: "#",
    children: "Export",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    href: "#",
    children: "Delete",
  },
};

export const Disabled: Story = {
  args: {
    variant: "default",
    href: "#",
    disabled: true,
    children: "Disabled Link",
  },
};

export const DisabledDanger: Story = {
  args: {
    variant: "danger",
    href: "#",
    disabled: true,
    children: "Disabled Delete Link",
  },
};

export const ExternalLink: Story = {
  args: {
    variant: "default",
    href: "https://example.com",
    target: "_blank",
    rel: "noopener noreferrer",
    children: "External Link",
  },
};

export const Nav: Story = {
  args: {
    variant: "nav",
    href: "#",
    children: "ダッシュボード",
  },
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
    href: "#",
    children: "ログアウト",
  },
};

export const ActionBlue: Story = {
  args: {
    variant: "action-blue",
    href: "#",
    children: "表示",
  },
};

export const ActionGreen: Story = {
  args: {
    variant: "action-green",
    href: "#",
    children: "コンボ",
  },
};

export const ActionRed: Story = {
  args: {
    variant: "action-red",
    href: "#",
    children: "削除",
  },
};

export const WithOnClick: Story = {
  args: {
    variant: "default",
    href: "#",
    onClick: (e) => {
      e.preventDefault();
      alert("Link clicked!");
    },
    children: "Click Handler Example",
  },
};

// Group story showing different variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Default & Danger</h3>
        <div className="space-x-4">
          <Link variant="default" href="#">Default Link</Link>
          <Link variant="danger" href="#">Danger Link</Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Navigation</h3>
        <div className="space-x-4">
          <Link variant="nav" href="#">ダッシュボード</Link>
          <Link variant="nav" href="#">Pool管理</Link>
          <Link variant="nav" href="#">メインサイト</Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Outlined</h3>
        <div>
          <Link variant="outlined" href="#">ログアウト</Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Actions</h3>
        <div className="space-x-4">
          <Link variant="action-blue" href="#">表示</Link>
          <Link variant="action-green" href="#">コンボ</Link>
          <Link variant="action-red" href="#">削除</Link>
        </div>
      </div>
    </div>
  ),
};