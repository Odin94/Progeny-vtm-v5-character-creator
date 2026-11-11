import { Code } from "@mantine/core"
import type { HomebrewItem } from "~/data/Homebrew"
import "./HomebrewPreview.css"

const formatRuleValue = (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value, null, 2)

/** Raw field-by-field dump of a homebrew item (used by moderation). */
const HomebrewRuleDetails = ({ item }: { item: HomebrewItem }) => (
    <dl className="hb-raw">
        {Object.entries(item)
            .filter(
                ([key, value]) =>
                    !["id", "kind", "name"].includes(key) && value !== "" && value !== undefined
            )
            .map(([key, value]) => (
                <div key={key} className="hb-raw__row">
                    <dt className="hb-raw__key">{key.replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="hb-raw__value">
                        {typeof value === "string" ? (
                            <span className="hb-raw__text">{value}</span>
                        ) : (
                            <Code block>{formatRuleValue(value)}</Code>
                        )}
                    </dd>
                </div>
            ))}
    </dl>
)

export default HomebrewRuleDetails
