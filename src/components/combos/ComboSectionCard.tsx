import { Combo } from "@/domain/entity/combo";
import SectionCard from "@/components/ui/SectionCard";
import Link from "next/link";
import { cardNameJa, newCardId } from "@/domain/entity/card";
import InfoDisplay from "@/components/ui/InfoDisplay";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import CardImage from "@/components/cards/CardImage.client";

interface Props {
  combo: Combo;
}

const ComboSectionCard = ({ combo }: Props) => {
  return (
    <SectionCard
      key={combo.id}
      title={combo.uses.map((use) => cardNameJa(use.card.relation)).join(" & ")}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {combo.uses.map((use) => (
          <Link key={use.card.id} href={`/admin/cards/${newCardId(use.card.name)}`}>
            <CardImage card={use.card.relation} />
          </Link>
        ))}
      </div>
      <InfoDisplay label="Color Identity">
        <ColorIdentityBadges colorIdentity={combo.identity} />
      </InfoDisplay>
      <InfoDisplay label="Prerequisites">{combo.notablePrerequisites}</InfoDisplay>
      <InfoDisplay label="Produces">
        <ul>
          {combo.produces.map((p) => (
            <li key={p.feature.id}>{p.feature.name}</li>
          ))}
        </ul>
      </InfoDisplay>
      <ol className="list-decimal list-inside">
        {combo.description.split("\n").map((line, idx) => (
          <li key={idx} className="mb-2">
            {line}
          </li>
        ))}
      </ol>
    </SectionCard>
  );
};

export default ComboSectionCard;
