import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LoadingSpinner from "./LoadingSpinner.client";

const meta: Meta<typeof LoadingSpinner> = {
  title: "UI/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    text: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const WithText: Story = {
  args: {
    size: "md",
    text: "読み込み中...",
  },
};

export const SmallWithText: Story = {
  args: {
    size: "sm",
    text: "処理中...",
  },
};

export const LargeWithText: Story = {
  args: {
    size: "lg",
    text: "データを取得しています...",
  },
};