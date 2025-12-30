import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Alert from "./Alert.client";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["error", "success", "warning", "info"],
    },
    onClose: {
      control: "boolean",
      mapping: {
        true: fn(),
        false: undefined,
      },
    },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: "info",
    children: "これは情報メッセージです。",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "操作が正常に完了しました。",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "注意が必要な状況です。",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: "エラーが発生しました。もう一度お試しください。",
  },
};

export const WithCloseButton: Story = {
  args: {
    variant: "error",
    children: "このアラートは閉じることができます。",
    onClose: fn(),
  },
};

export const WithoutCloseButton: Story = {
  args: {
    variant: "info",
    children: "このアラートには閉じるボタンがありません。",
    onClose: undefined,
  },
};

export const LongMessage: Story = {
  args: {
    variant: "warning",
    children: (
      <div>
        <div className="font-semibold mb-2">パースに失敗した行（3行）</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>行 5: 1 Invalid Card Name (SET) 123</li>
          <li>行 12: Missing set information</li>
          <li>行 18: Incorrect format detected</li>
        </ul>
      </div>
    ),
    onClose: fn(),
  },
};