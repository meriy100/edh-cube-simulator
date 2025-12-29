import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Input from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    fieldSize: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    fullWidth: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const Small: Story = {
  args: {
    fieldSize: "sm",
    placeholder: "Small input",
  },
};

export const Medium: Story = {
  args: {
    fieldSize: "md",
    placeholder: "Medium input",
  },
};

export const Large: Story = {
  args: {
    fieldSize: "lg",
    placeholder: "Large input",
  },
};

export const WithValue: Story = {
  args: {
    value: "Some text value",
    placeholder: "Enter text...",
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: "Invalid input",
    value: "invalid@",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
    value: "Cannot edit this",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: "Full width input",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
    value: "secretpassword",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email address",
    value: "user@example.com",
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number",
    value: 42,
    min: 0,
    max: 100,
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
};
