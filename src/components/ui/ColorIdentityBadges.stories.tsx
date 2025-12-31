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
    colorIdentity: ["w"],
  },
};

export const MonoBlue: Story = {
  args: {
    colorIdentity: ["u"],
  },
};

export const MonoBlack: Story = {
  args: {
    colorIdentity: ["b"],
  },
};

export const MonoRed: Story = {
  args: {
    colorIdentity: ["r"],
  },
};

export const MonoGreen: Story = {
  args: {
    colorIdentity: ["g"],
  },
};

export const Multicolor: Story = {
  args: {
    colorIdentity: ["w", "u"],
  },
};

export const TriColor: Story = {
  args: {
    colorIdentity: ["r", "w", "b"],
  },
};

export const FiveColor: Story = {
  args: {
    colorIdentity: ["w", "u", "b", "r", "g"],
  },
};
