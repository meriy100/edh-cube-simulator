import type { Meta, StoryObj } from "@storybook/nextjs";
import PageHeader from "./PageHeader";
import BackLink from "./BackLink";
import Button from "./Button";

const meta: Meta<typeof PageHeader> = {
  title: "UI/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: {
      description: "The main title of the page",
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
    title: "Pool Detail",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "EDH Cube Draft Simulator",
    subtitle: "Manage your cube pools and simulate drafts",
  },
};

export const WithBackLink: Story = {
  args: {
    title: "Pool Detail",
    backElement: <BackLink href="/" />,
  },
};

export const WithActions: Story = {
  args: {
    title: "Pool Detail",
    actions: (
      <>
        <Button variant="outline">Draft</Button>
        <Button variant="outline">Combos</Button>
        <Button variant="primary">Sample pack</Button>
      </>
    ),
  },
};

export const WithEverything: Story = {
  args: {
    title: "Pool Detail",
    subtitle: "Draft ID: abc-123",
    backElement: <BackLink href="/" />,
    actions: (
      <>
        <Button variant="outline">Draft</Button>
        <Button variant="outline">Export</Button>
        <Button variant="primary">Sample pack</Button>
      </>
    ),
  },
};

export const AdminDashboard: Story = {
  args: {
    title: "管理ダッシュボード",
    subtitle: "EDH Cube Simulator の管理画面へようこそ。システムの概要と管理機能にアクセスできます。",
  },
};