import type { HomebrewPredatorType } from "~/data/Homebrew"
import OrnamentalDivider from "./OrnamentalDivider"
import { DotPips } from "./HomebrewCodex"
import "./HomebrewPreview.css"

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "±0")
const titleCase = (value: string) => value.replace(/\b\w/g, (character) => character.toUpperCase())

const HomebrewPredatorTypePreview = ({ item }: { item: HomebrewPredatorType }) => (
    <article className="hb-sheet" data-kind="predatorType">
        <header className="hb-sheet__header">
            <span className="hb-sheet__eyebrow">Homebrew Predator Type</span>
            <h3 className="hb-sheet__title">{item.name || "Untitled predator type"}</h3>
        </header>

        <section className="hb-sheet__intro">
            <div className="hb-sheet__copy">
                <p>{item.summary || "No summary provided."}</p>
                {item.description ? <p>{item.description}</p> : null}
            </div>
            <aside className="hb-sheet__aside hb-sheet__stats">
                <div className="hb-sheet__stat" data-tone="blood">
                    <span className="hb-sheet__label">Humanity</span>
                    <span className="hb-sheet__stat-value">{signed(item.humanityChange)}</span>
                </div>
                <div className="hb-sheet__stat">
                    <span className="hb-sheet__label">Blood Potency</span>
                    <span className="hb-sheet__stat-value">{signed(item.bloodPotencyChange)}</span>
                </div>
            </aside>
        </section>

        <OrnamentalDivider label="The Hunt" compact />

        <div className="hb-sheet__columns">
            <section>
                <span className="hb-sheet__label">Specialty choices</span>
                {item.specialtyOptions.length ? (
                    <ul className="hb-sheet__list">
                        {item.specialtyOptions.map((specialty, index) => (
                            <li key={index}>
                                <span>
                                    <strong>{titleCase(specialty.skill)}</strong>: {specialty.name}
                                </span>
                                {specialty.customInput ? (
                                    <span className="hb-sheet__muted">
                                        Prompt: {specialty.customInput}
                                    </span>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="hb-sheet__muted">None</p>
                )}
            </section>
            <section>
                <span className="hb-sheet__label">Bonus Discipline</span>
                {item.disciplineOptions.length ? (
                    <span className="hb-sheet__tags">
                        {item.disciplineOptions.map((discipline, index) => (
                            <span key={index} className="hb-sheet__tag">
                                {titleCase(discipline.name)}
                            </span>
                        ))}
                    </span>
                ) : (
                    <p className="hb-sheet__muted">None</p>
                )}
            </section>
            {item.skillBonuses.length ? (
                <section>
                    <span className="hb-sheet__label">Skill dots</span>
                    <ul className="hb-sheet__list">
                        {item.skillBonuses.map((grant) => (
                            <li key={grant.skill} className="hb-sheet__grant">
                                <span>{titleCase(grant.skill)}</span>
                                <DotPips value={grant.dots} tone="gold" />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </div>

        {item.meritsAndFlaws.length || item.selectableMeritsAndFlaws.length ? (
            <>
                <OrnamentalDivider label="Gifts & Costs" compact />
                <div className="hb-sheet__columns">
                    {item.meritsAndFlaws.length ? (
                        <section>
                            <span className="hb-sheet__label">Granted</span>
                            <ul className="hb-sheet__list">
                                {item.meritsAndFlaws.map((grant, index) => (
                                    <li key={index}>
                                        <span className="hb-sheet__grant">
                                            <strong>{grant.name || "Unnamed"}</strong>
                                            <DotPips
                                                value={grant.level}
                                                tone={grant.type === "flaw" ? "blood" : "gold"}
                                            />
                                            <span className="hb-sheet__muted">{grant.type}</span>
                                        </span>
                                        {grant.summary ? (
                                            <span className="hb-sheet__muted">{grant.summary}</span>
                                        ) : null}
                                        {grant.excludes.length ? (
                                            <span className="hb-sheet__muted">
                                                Excludes: {grant.excludes.join(", ")}
                                            </span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                    {item.selectableMeritsAndFlaws.map((group, groupIndex) => (
                        <section key={groupIndex}>
                            <span className="hb-sheet__label">
                                {group.exclusive ? "Choose one" : "Distribute"} ·{" "}
                                {group.totalPoints} {group.totalPoints === 1 ? "dot" : "dots"}
                            </span>
                            <ul className="hb-sheet__list">
                                {group.options.map((option, optionIndex) => (
                                    <li key={optionIndex}>
                                        <span className="hb-sheet__grant">
                                            <strong>{option.name || "Unnamed"}</strong>
                                            <span className="hb-sheet__muted">
                                                up to {option.maxLevel} · {option.type}
                                            </span>
                                        </span>
                                        {option.summary ? (
                                            <span className="hb-sheet__muted">
                                                {option.summary}
                                            </span>
                                        ) : null}
                                        {option.excludes.length ? (
                                            <span className="hb-sheet__muted">
                                                Excludes: {option.excludes.join(", ")}
                                            </span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </>
        ) : null}
    </article>
)
export default HomebrewPredatorTypePreview
