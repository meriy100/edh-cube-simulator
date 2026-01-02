import ListItem from "@/components/ui/ListItem.client";
import { Pool } from "@/domain/entity/pool";
import Button from "@/components/ui/Button.client";
import DeletePoolButton from "@/app/admin/pools/DeletePoolButton.client";

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
          actions={
            <div className="flex flex-row gap-2">
              <Button href={`/admin/pools/${p.id}`}>Show</Button>
              <DeletePoolButton id={p.id} />
            </div>
          }
        />
      ))}
    </div>
  );
};

export default PoolsList;
