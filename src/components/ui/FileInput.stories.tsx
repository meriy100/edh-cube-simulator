import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import FileInput from "./FileInput.client";

const meta: Meta<typeof FileInput> = {
  title: "UI/FileInput",
  component: FileInput,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    fieldSize: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    accept: {
      control: "text",
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
    dragAndDrop: {
      control: "boolean",
    },
    multiple: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
    onFilesSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    fieldSize: "sm",
  },
};

export const Medium: Story = {
  args: {
    fieldSize: "md",
  },
};

export const Large: Story = {
  args: {
    fieldSize: "lg",
  },
};

export const WithAcceptFilter: Story = {
  args: {
    accept: ".jpg,.jpeg,.png,.gif",
  },
};

export const MultipleFiles: Story = {
  args: {
    multiple: true,
  },
};

export const DragAndDrop: Story = {
  args: {
    dragAndDrop: true,
  },
};

export const DragAndDropSmall: Story = {
  args: {
    dragAndDrop: true,
    fieldSize: "sm",
  },
};

export const DragAndDropLarge: Story = {
  args: {
    dragAndDrop: true,
    fieldSize: "lg",
  },
};

export const DragAndDropMultiple: Story = {
  args: {
    dragAndDrop: true,
    multiple: true,
  },
};

export const DragAndDropWithAccept: Story = {
  args: {
    dragAndDrop: true,
    accept: ".csv,.txt",
  },
};

export const Error: Story = {
  args: {
    error: true,
  },
};

export const ErrorDragAndDrop: Story = {
  args: {
    error: true,
    dragAndDrop: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledDragAndDrop: Story = {
  args: {
    disabled: true,
    dragAndDrop: true,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

export const FullWidthDragAndDrop: Story = {
  args: {
    fullWidth: true,
    dragAndDrop: true,
  },
};

export const CSVFiles: Story = {
  args: {
    accept: ".csv",
    dragAndDrop: true,
    multiple: true,
  },
};

export const ImageFiles: Story = {
  args: {
    accept: "image/*",
    dragAndDrop: true,
    multiple: true,
  },
};