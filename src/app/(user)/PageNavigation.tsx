import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown } from "lucide-react";

interface Props {
  commander?: boolean;
  normals?: boolean;
  combos?: boolean;
}

const PageNavigation = ({ commander, normals, combos }: Props) => {
  return (
    <div className="flex flex-row gap-2">
      {commander ? (
        <ActionCard
          title="統率者"
          description="金シールが貼ってある統率者のプール"
          icon={<Crown className="text-orange-500" />}
          href="/commanders/wubrg"
        />
      ) : null}
      {normals ? (
        <ActionCard
          title="通常カード"
          description="シールなしのカードプール"
          icon={<ChessPawn className="text-pink-600" />}
          href="/normals/wubrg"
        />
      ) : null}
      {combos ? (
        <ActionCard
          title="コンボ"
          description="プールで成立するコンボ集"
          icon={<BookUp2 className="text-green-600" />}
          href="/combos/wubrg"
        />
      ) : null}
    </div>
  );
};

export default PageNavigation;
