import { ActionIcon, Tooltip } from "@mantine/core"
import { IconBrandReddit, IconButterfly } from "@tabler/icons-react"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import classes from "./SocialIcons.module.css"

const SOCIAL_LINKS = [
    { ...CONTACT_LINKS.reddit, icon: IconBrandReddit, brand: "reddit" },
    { ...CONTACT_LINKS.bluesky, icon: IconButterfly, brand: "bluesky" }
] as const

export const SocialIcons = () => {
    return (
        <p className={classes.root}>
            <span>For feature requests, bug reports and general feedback, message me on:</span>
            <span className={classes.links}>
                {SOCIAL_LINKS.map(({ href, label, icon: Icon, brand }) => (
                    <Tooltip key={href} label={label}>
                        <ActionIcon
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            variant="default"
                            size="lg"
                            aria-label={label}
                            className={classes.link}
                            data-brand={brand}
                        >
                            <Icon size={20} stroke={1.6} />
                        </ActionIcon>
                    </Tooltip>
                ))}
            </span>
        </p>
    )
}
