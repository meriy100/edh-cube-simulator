import ListItem from "@/components/ui/ListItem.client";
import { Pool } from "@/domain/entity/pool";
import Link from "next/link";

interface Props {
  pools: Pool[];
}

const PoolsList = ({ pools }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {pools.map((p) => (
        <Link key={p.id} href={`/admin/pools/${p.id}`}>
          <ListItem key={p.id} title={p.version} subtitle={p.createdAt.toLocaleDateString()} />
        </Link>
      ))}
    </div>
  );
};

export default PoolsList;
