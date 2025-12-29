import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ListItem from "./ListItem";
import Button from "./Button";

const meta: Meta<typeof ListItem> = {
  title: "UI/ListItem",
  component: ListItem,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: {
      description: "The main title of the list item",
      control: "text",
    },
    subtitle: {
      description: "Optional subtitle or description",
      control: "text",
    },
    metadata: {
      description: "Optional metadata (usually timestamp or count)",
      control: "text",
    },
    className: {
      description: "Additional CSS classes",
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "(untitled)",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "My Cube Pool",
    subtitle: "cards: 360",
  },
};

export const WithMetadata: Story = {
  args: {
    title: "My Cube Pool",
    metadata: "2024/12/29 10:30:00",
  },
};

export const WithActions: Story = {
  args: {
    title: "My Cube Pool",
    subtitle: "cards: 360",
    metadata: "2024/12/29 10:30:00",
    actions: (
      <>
        <Button variant="link">Show</Button>
        <Button variant="danger">Delete</Button>
      </>
    ),
  },
};

export const PoolItem: Story = {
  args: {
    title: "(untitled)",
    subtitle: "cards: 360",
    metadata: "2024/12/29 10:30:00",
    actions: (
      <>
        <Button variant="link" onClick={() => console.log("Show")}>
          Show
        </Button>
        <Button variant="danger" onClick={() => console.log("Delete")}>
          Delete
        </Button>
      </>
    ),
  },
};

export const DraftItem: Story = {
  args: {
    title: "My Cube Pool",
    metadata: "2024/12/29 10:30:00 / seat 8",
    actions: (
      <>
        <Button variant="link" onClick={() => console.log("Open")}>
          Open
        </Button>
        <Button variant="danger" onClick={() => console.log("Delete")}>
          Delete
        </Button>
      </>
    ),
  },
};

export const Clickable: Story = {
  args: {
    title: "Clickable Item",
    subtitle: "This entire item is clickable",
    onClick: () => alert("Item clicked!"),
  },
};

export const ListExample: Story = {
  render: () => (
    <div className="space-y-2 max-w-2xl">
      <ListItem
        title="EDH Cube 2024"
        subtitle="cards: 360"
        metadata="2024/12/29 10:30:00"
        actions={
          <>
            <Button variant="link">Show</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
      <ListItem
        title="Vintage Cube"
        subtitle="cards: 540"
        metadata="2024/12/28 15:45:00"
        actions={
          <>
            <Button variant="link">Show</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
      <ListItem
        title="(untitled)"
        subtitle="cards: 180"
        metadata="2024/12/27 09:15:00"
        actions={
          <>
            <Button variant="link">Show</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
    </div>
  ),
};
