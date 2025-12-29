import type { Meta, StoryObj } from "@storybook/react";
import Textarea from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    monospace: {
      control: "boolean",
    },
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    readOnly: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your message here...",
  },
};

export const WithValue: Story = {
  args: {
    value: "This is some sample text in the textarea.\n\nYou can type multiple lines here.",
    readOnly: true,
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    placeholder: "Small textarea...",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    placeholder: "Large textarea for longer content...",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    placeholder: "Extra large textarea for extensive content...",
  },
};

export const Monospace: Story = {
  args: {
    monospace: true,
    placeholder: "Code or monospace text...",
    value: "function example() {\n  console.log('Hello, world!');\n  return true;\n}",
    readOnly: true,
  },
};

export const CodeEditor: Story = {
  args: {
    monospace: true,
    size: "lg",
    value: `1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R
1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG
1 Accursed Marauder (MH3) 80 #2-mass-disruption #9-1-B`,
    readOnly: true,
  },
};

export const WithError: Story = {
  args: {
    error: true,
    placeholder: "This textarea has an error state...",
    value: "Invalid content",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "This textarea is disabled and cannot be edited.",
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "This textarea is read-only.\nYou can select and copy the text, but cannot edit it.",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <label htmlFor="description" className="block text-sm font-medium mb-2">
        Description
      </label>
      <Textarea
        {...args}
        id="description"
        placeholder="Enter a detailed description..."
      />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="w-full max-w-md space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter title"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Content
        </label>
        <Textarea
          id="content"
          size="lg"
          placeholder="Write your content here..."
        />
      </div>
      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1">
          Code Snippet
        </label>
        <Textarea
          id="code"
          monospace
          size="md"
          placeholder="// Enter your code here"
        />
      </div>
    </form>
  ),
};