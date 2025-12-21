import { ActionIcon, Text } from "@mantine/core"
import { IconBrandReddit, IconButterfly } from "@tabler/icons-react"

export const SocialIcons = () => {
    return (
        <Text fz={"xl"} mb="xl">
            For feature requests, bug reports and general feedback, message me on:{" "}
            <ActionIcon
                component="a"
                href="https://www.reddit.com/user/ProgenyDev/"
                variant="default"
                c={"#ff6314"}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", verticalAlign: "middle" }}
            >
                <IconBrandReddit />
            </ActionIcon>{" "}
            <ActionIcon
                component="a"
                href="https://bsky.app/profile/odinmatthias.bsky.social"
                variant="default"
                c={"#208BFE"}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", verticalAlign: "middle" }}
            >
                <IconButterfly />
            </ActionIcon>
        </Text>
    )
}
