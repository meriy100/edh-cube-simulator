import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "link", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Submit",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Next",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Previous",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Close",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Export",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete",
  },
};

export const Small: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    variant: "primary",
    size: "lg",
    children: "Large Button",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled",
  },
};

export const DisabledLink: Story = {
  args: {
    variant: "link",
    disabled: true,
    children: "Disabled Link",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Submitting...",
  },
};