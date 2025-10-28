import { ActionIcon, Text } from "@mantine/core"
import { IconBrandReddit, IconBrandTwitter, IconButterfly } from "@tabler/icons-react"

export const SocialIcons = () => {
    return (
        <Text fz={"xl"}>
            For feature requests, bug reports and general feedback, message me on:&nbsp;
            <ActionIcon
                display={"inline"}
                component="a"
                href="https://www.reddit.com/user/ProgenyDev/"
                variant="default"
                c={"#ff6314"}
                target="_blank"
                rel="noreferrer"
            >
                <IconBrandReddit />
            </ActionIcon>
            &nbsp;
            <ActionIcon
                display={"inline"}
                component="a"
                href="https://bsky.app/profile/odinmatthias.bsky.social"
                variant="default"
                c={"#208BFE"}
                target="_blank"
                rel="noreferrer"
            >
                <IconButterfly />
            </ActionIcon>
        </Text>
    )
}
