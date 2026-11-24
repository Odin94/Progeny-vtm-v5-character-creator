import OrnamentalDivider from "~/components/OrnamentalDivider"
import { DotPips } from "~/components/HomebrewCodex"
import type { HomebrewLoresheet } from "~/data/Homebrew"
import "./HomebrewPreview.css"

const HomebrewLoresheetPreview = ({ item }: { item: HomebrewLoresheet }) => (
    <article className="hb-sheet" data-kind="loresheet">
        <header className="hb-sheet__header">
            <span className="hb-sheet__eyebrow">{item.source || "Homebrew"} · Loresheet</span>
            <h3 className="hb-sheet__title">{item.name || "Untitled loresheet"}</h3>
        </header>

        <section className="hb-sheet__intro">
            <div className="hb-sheet__copy">
                <p>{item.summary || item.description || "No description provided."}</p>
                {item.description && item.description !== item.summary ? (
                    <p>{item.description}</p>
                ) : null}
            </div>
            <aside className="hb-sheet__aside">
                <span className="hb-sheet__label">Requirements</span>
                <p>{item.requirements || "None"}</p>
            </aside>
        </section>

        <OrnamentalDivider label="Lore" compact />

        <ol className="hb-sheet__tiers" aria-label="Loresheet levels">
            {item.tiers.map((tier) => (
                <li className="hb-sheet__tier" key={tier.level}>
                    <div className="hb-sheet__tier-heading">
                        <DotPips value={tier.level} tone="blood" label={`Level ${tier.level}`} />
                        <span className="hb-sheet__tier-title">
                            {tier.name || `Level ${tier.level}`}
                        </span>
                    </div>
                    <p className="hb-sheet__tier-text">
                        {tier.summary || "No benefit description provided."}
                    </p>
                </li>
            ))}
        </ol>
    </article>
)

export default HomebrewLoresheetPreview
