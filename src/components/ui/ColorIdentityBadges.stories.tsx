import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ColorIdentityBadges from "./ColorIdentityBadges.client";

const meta = {
  title: "UI/ColorIdentityBadges",
  component: ColorIdentityBadges,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ColorIdentityBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colorless: Story = {
  args: {
    colorIdentity: [],
  },
};

export const MonoWhite: Story = {
  args: {
    colorIdentity: ["W"],
  },
};

export const MonoBlue: Story = {
  args: {
    colorIdentity: ["U"],
  },
};

export const MonoBlack: Story = {
  args: {
    colorIdentity: ["B"],
  },
};

export const MonoRed: Story = {
  args: {
    colorIdentity: ["R"],
  },
};

export const MonoGreen: Story = {
  args: {
    colorIdentity: ["G"],
  },
};

export const Multicolor: Story = {
  args: {
    colorIdentity: ["W", "U"],
  },
};

export const TriColor: Story = {
  args: {
    colorIdentity: ["R", "W", "B"],
  },
};

export const FiveColor: Story = {
  args: {
    colorIdentity: ["W", "U", "B", "R", "G"],
  },
};
