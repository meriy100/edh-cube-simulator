import ListItem from "@/components/ui/ListItem";
import { Pool } from "@/domain/entity/pool";

interface Props {
  pools: Pool[];
}

const PoolsList = ({ pools }: Props) => {
  return (
    <div>
      {pools.map((p) => (
        <ListItem key={p.id} title={p.version} />
      ))}
    </div>
  );
};

export default PoolsList;
