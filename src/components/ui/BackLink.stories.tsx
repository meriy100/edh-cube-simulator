import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BackLink from "./BackLink";

// Mock Next.js router for Storybook
const mockRouter = {
  push: (url: string) => console.log(`Navigate to: ${url}`),
  replace: (url: string) => console.log(`Replace with: ${url}`),
  back: () => console.log("Navigate back"),
  forward: () => console.log("Navigate forward"),
  refresh: () => console.log("Refresh page"),
  prefetch: () => Promise.resolve(),
};

const meta: Meta<typeof BackLink> = {
  title: "UI/BackLink",
  component: BackLink,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      router: mockRouter,
    },
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
