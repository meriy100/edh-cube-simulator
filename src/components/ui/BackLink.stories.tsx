import type { Meta, StoryObj } from "@storybook/nextjs";
import BackLink from "./BackLink";

const meta: Meta<typeof BackLink> = {
  title: "UI/BackLink",
  component: BackLink,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    href: {
      description: "The URL to navigate back to",
      control: "text",
    },
    children: {
      description: "The content of the link",
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
    href: "/",
    children: "← Back",
  },
};

export const CustomText: Story = {
  args: {
    href: "/pools",
    children: "← Back to Pools",
  },
};

export const Japanese: Story = {
  args: {
    href: "/",
    children: "← 戻る",
  },
};

export const WithCustomStyling: Story = {
  args: {
    href: "/",
    children: "← Back",
    className: "text-blue-600 font-medium",
  },
};