import ListItem from "@/components/ui/ListItem.client";
import { Pool } from "@/domain/entity/pool";

interface Props {
  pools: Pool[];
}

const PoolsList = ({ pools }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {pools.map((p) => (
        <ListItem key={p.id} title={p.version} subtitle={p.createdAt.toLocaleDateString()} />
      ))}
    </div>
  );
};

export default PoolsList;
