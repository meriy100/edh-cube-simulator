import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    showCloseButton: {
      control: "boolean",
    },
    closeOnBackdropClick: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Template component for interactive stories
function ModalTemplate(args: any) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Modal
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      >
        {args.children}
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: ModalTemplate,
  args: {
    title: "Default Modal",
    children: (
      <div className="space-y-4">
        <p>This is a default modal with some content.</p>
        <p>It includes a title and close button by default.</p>
      </div>
    ),
  },
};

export const WithoutTitle: Story = {
  render: ModalTemplate,
  args: {
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Content</h3>
        <p>This modal doesn't have a title prop, so you can customize the header however you like.</p>
      </div>
    ),
  },
};

export const WithoutCloseButton: Story = {
  render: ModalTemplate,
  args: {
    title: "No Close Button",
    showCloseButton: false,
    children: (
      <div className="space-y-4">
        <p>This modal doesn't show the default close button.</p>
        <p>You'll need to provide your own way to close it or rely on clicking the backdrop.</p>
      </div>
    ),
  },
};

export const NoBackdropClose: Story = {
  render: ModalTemplate,
  args: {
    title: "Modal with No Backdrop Close",
    closeOnBackdropClick: false,
    children: (
      <div className="space-y-4">
        <p>This modal won't close when you click the backdrop.</p>
        <p>You must use the close button or press Escape.</p>
      </div>
    ),
  },
};

export const SmallModal: Story = {
  render: ModalTemplate,
  args: {
    title: "Small Modal",
    size: "sm",
    children: (
      <div className="space-y-4">
        <p>This is a small modal.</p>
      </div>
    ),
  },
};

export const LargeModal: Story = {
  render: ModalTemplate,
  args: {
    title: "Large Modal",
    size: "lg",
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more space for content.</p>
        <p>Perfect for forms, detailed information, or complex interactions.</p>
      </div>
    ),
  },
};

export const ExtraLargeModal: Story = {
  render: ModalTemplate,
  args: {
    title: "Extra Large Modal",
    size: "xl",
    children: (
      <div className="space-y-4">
        <p>This is an extra large modal.</p>
        <textarea
          className="w-full h-32 p-2 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
          placeholder="Large text area example..."
          readOnly
        />
        <div className="flex gap-2">
          <Button variant="primary">Save</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </div>
    ),
  },
};

export const FormModal: Story = {
  render: ModalTemplate,
  args: {
    title: "Form Example",
    size: "md",
    children: (
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your message"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary">
            Submit
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    ),
  },
};