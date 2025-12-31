import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "./Button.client";
import { Plus, Download, Edit, Trash2, Search, ArrowRight, ArrowLeft } from "lucide-react";

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
      options: ["primary", "secondary", "outline", "ghost", "danger"],
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


export const Loading: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Submitting...",
  },
};

// Icon Button Stories
export const WithIcon: Story = {
  args: {
    variant: "primary",
    icon: Plus,
    children: "Add Item",
  },
};

export const IconOnly: Story = {
  args: {
    variant: "outline",
    icon: Search,
    children: "",
  },
};

export const IconSecondary: Story = {
  args: {
    variant: "secondary",
    icon: Download,
    children: "Download File",
  },
};

export const IconOutline: Story = {
  args: {
    variant: "outline",
    icon: Edit,
    children: "Edit Content",
  },
};

export const IconGhost: Story = {
  args: {
    variant: "ghost",
    icon: ArrowRight,
    children: "Next Page",
  },
};

export const IconDanger: Story = {
  args: {
    variant: "danger",
    icon: Trash2,
    children: "Delete Item",
  },
};

export const IconSmall: Story = {
  args: {
    variant: "primary",
    size: "sm",
    icon: Plus,
    children: "Add",
  },
};

export const IconLarge: Story = {
  args: {
    variant: "primary",
    size: "lg",
    icon: ArrowLeft,
    children: "Go Back",
  },
};

export const IconDisabled: Story = {
  args: {
    variant: "primary",
    icon: Download,
    disabled: true,
    children: "Download Disabled",
  },
};
