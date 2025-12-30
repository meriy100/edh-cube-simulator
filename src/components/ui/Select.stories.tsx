import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Select from "./Select.client";

const sampleOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
  { value: "option4", label: "Option 4" },
];

const sortOptions = [
  { value: "createdAt", label: "作成日時" },
  { value: "title", label: "名前" },
  { value: "cards", label: "カード数" },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    fieldSize: {
      control: "select",
      options: ["sm", "md", "lg"],
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
    options: sampleOptions,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: sampleOptions,
  },
};

export const WithPlaceholder: Story = {
  args: {
    options: sampleOptions,
    placeholder: "Choose an option...",
  },
};

export const Small: Story = {
  args: {
    fieldSize: "sm",
    options: sampleOptions,
    placeholder: "Small select",
  },
};

export const Medium: Story = {
  args: {
    fieldSize: "md",
    options: sampleOptions,
    placeholder: "Medium select",
  },
};

export const Large: Story = {
  args: {
    fieldSize: "lg",
    options: sampleOptions,
    placeholder: "Large select",
  },
};

export const WithValue: Story = {
  args: {
    options: sampleOptions,
    value: "option2",
  },
};

export const Error: Story = {
  args: {
    error: true,
    options: sampleOptions,
    placeholder: "Invalid selection",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    options: sampleOptions,
    value: "option1",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    options: sampleOptions,
    placeholder: "Full width select",
  },
};

export const SortExample: Story = {
  args: {
    options: sortOptions,
    placeholder: "並び順を選択",
    value: "createdAt",
  },
};

export const WithDisabledOptions: Story = {
  args: {
    options: [
      { value: "available1", label: "Available Option 1" },
      { value: "disabled1", label: "Disabled Option 1", disabled: true },
      { value: "available2", label: "Available Option 2" },
      { value: "disabled2", label: "Disabled Option 2", disabled: true },
      { value: "available3", label: "Available Option 3" },
    ],
    placeholder: "Select an option",
  },
};
