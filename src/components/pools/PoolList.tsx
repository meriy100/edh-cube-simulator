import ListItem from "@/components/ui/ListItem.client";
import { Pool } from "@/domain/entity/pool";
import Button from "@/components/ui/Button.client";

interface Props {
  pools: Pool[];
}

const PoolsList = ({ pools }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {pools.map((p) => (
        <ListItem
          key={p.id}
          title={p.version}
          subtitle={p.createdAt.toLocaleDateString()}
          actions={<Button href={`/admin/pools/${p.id}`}>Show</Button>}
        />
      ))}
    </div>
  );
};

export default PoolsList;
