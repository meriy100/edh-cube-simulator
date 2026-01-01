import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button, { type ButtonAsButtonProps, type ButtonAsLinkProps } from "./Button.client";
import { Plus, Download, Edit, Trash2, Search, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";

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
    href: {
      control: "text",
    },
  },
};

export default meta;
type ButtonStory = StoryObj<ButtonAsButtonProps>;
type LinkStory = StoryObj<ButtonAsLinkProps>;

// Button Stories
export const Primary: ButtonStory = {
  args: {
    variant: "primary",
    children: "Submit",
  },
};

export const Secondary: ButtonStory = {
  args: {
    variant: "secondary",
    children: "Next",
  },
};

export const Outline: ButtonStory = {
  args: {
    variant: "outline",
    children: "Previous",
  },
};

export const Ghost: ButtonStory = {
  args: {
    variant: "ghost",
    children: "Close",
  },
};

export const Danger: ButtonStory = {
  args: {
    variant: "danger",
    children: "Delete",
  },
};

export const Small: ButtonStory = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Small Button",
  },
};

export const Large: ButtonStory = {
  args: {
    variant: "primary",
    size: "lg",
    children: "Large Button",
  },
};

export const Disabled: ButtonStory = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled",
  },
};

export const Loading: ButtonStory = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Submitting...",
  },
};

// Icon Button Stories
export const WithIcon: ButtonStory = {
  args: {
    variant: "primary",
    icon: Plus,
    children: "Add Item",
  },
};

export const IconOnly: ButtonStory = {
  args: {
    variant: "outline",
    icon: Search,
    children: "",
  },
};

export const IconSecondary: ButtonStory = {
  args: {
    variant: "secondary",
    icon: Download,
    children: "Download File",
  },
};

export const IconOutline: ButtonStory = {
  args: {
    variant: "outline",
    icon: Edit,
    children: "Edit Content",
  },
};

export const IconGhost: ButtonStory = {
  args: {
    variant: "ghost",
    icon: ArrowRight,
    children: "Next Page",
  },
};

export const IconDanger: ButtonStory = {
  args: {
    variant: "danger",
    icon: Trash2,
    children: "Delete Item",
  },
};

export const IconSmall: ButtonStory = {
  args: {
    variant: "primary",
    size: "sm",
    icon: Plus,
    children: "Add",
  },
};

export const IconLarge: ButtonStory = {
  args: {
    variant: "primary",
    size: "lg",
    icon: ArrowLeft,
    children: "Go Back",
  },
};

export const IconDisabled: ButtonStory = {
  args: {
    variant: "primary",
    icon: Download,
    disabled: true,
    children: "Download Disabled",
  },
};

// Link Stories
export const PrimaryLink: LinkStory = {
  args: {
    variant: "primary",
    href: "/example",
    children: "Go to Page",
  },
};

export const SecondaryLink: LinkStory = {
  args: {
    variant: "secondary",
    href: "/docs",
    children: "View Documentation",
  },
};

export const OutlineLink: LinkStory = {
  args: {
    variant: "outline",
    href: "/profile",
    children: "Edit Profile",
  },
};

export const GhostLink: LinkStory = {
  args: {
    variant: "ghost",
    href: "/settings",
    children: "Settings",
  },
};

export const DangerLink: LinkStory = {
  args: {
    variant: "danger",
    href: "/delete-account",
    children: "Delete Account",
  },
};

export const ExternalLinkButton: LinkStory = {
  args: {
    variant: "primary",
    href: "https://example.com",
    target: "_blank",
    rel: "noopener noreferrer",
    icon: ExternalLink,
    children: "External Site",
  },
};

export const LinkWithIcon: LinkStory = {
  args: {
    variant: "outline",
    href: "/dashboard",
    icon: ArrowRight,
    children: "Go to Dashboard",
  },
};
