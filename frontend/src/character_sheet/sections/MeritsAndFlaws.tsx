import {
    Box,
    Grid,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    Badge,
    useMantineTheme,
    Center,
    ActionIcon,
    Modal,
    Button,
    Divider,
    Tooltip
} from "@mantine/core"
import { memo, useState, useMemo } from "react"
import type { SheetOptions } from "../CharacterSheet"
import { bgAlpha, hexToRgba } from "../utils/style"
import MeritFlawSelectModal from "../components/MeritFlawSelectModal"
import { MeritFlaw } from "~/data/Character"
import { IconPlus, IconX } from "@tabler/icons-react"
import { getSheetMeritsAndFlaws } from "../utils/meritsAndFlaws"
import { getMeritFlawDisplayName } from "~/data/meritsAndFlawsResolution"

type MeritsAndFlawsProps = {
    options: SheetOptions
}

const MeritsAndFlaws = ({ options }: MeritsAndFlawsProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const [meritModalOpened, setMeritModalOpened] = useState(false)
    const [flawModalOpened, setFlawModalOpened] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{
        type: "merit" | "flaw"
        item: MeritFlaw
    } | null>(null)
    const isEditable = mode === "xp" || mode === "free"
    const isFreeMode = mode === "free"

    // TODOdin: Make descriptions of merits and flaws editable
    const { merits: allMerits, flaws: allFlaws } = useMemo(
        () => getSheetMeritsAndFlaws(character),
        [character]
    )

    if (allMerits.length === 0 && allFlaws.length === 0 && !isEditable) {
        return null
    }

    const handleDeleteMerit = (merit: MeritFlaw) => {
        setItemToDelete({ type: "merit", item: merit })
    }

    const handleDeleteFlaw = (flaw: MeritFlaw) => {
        setItemToDelete({ type: "flaw", item: flaw })
    }

    const confirmDelete = () => {
        if (!itemToDelete) return

        if (itemToDelete.type === "merit") {
            setCharacter((current) => ({
                ...current,
                merits: current.merits.filter((m) => m !== itemToDelete.item)
            }))
        } else {
            setCharacter((current) => ({
                ...current,
                flaws: current.flaws.filter((f) => f !== itemToDelete.item)
            }))
        }

        setItemToDelete(null)
    }

    return (
        <>
            <Box>
                <Title order={2} mb="md" c={primaryColor}>
                    Merits & Flaws
                </Title>
                <Grid>
                    {allMerits.length > 0 || isEditable ? (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={4} mb="sm">
                                Merits
                            </Title>
                            <Stack gap="xs">
                                {allMerits.map(
                                    (
                                        {
                                            meritFlaw: merit,
                                            isFromPredatorType,
                                            isUpgradedFromPredatorType,
                                            isFromLoresheet,
                                            isUpgradedFromLoresheet
                                        },
                                        index
                                    ) => {
                                        const isFromBonus = isFromPredatorType || isFromLoresheet
                                        const badgeText = isFromLoresheet
                                            ? isUpgradedFromLoresheet
                                                ? "Upgraded from loresheet"
                                                : "From loresheet"
                                            : isUpgradedFromPredatorType
                                              ? "Upgraded from predator type"
                                              : "From predator type"
                                        const meritPaper = (
                                            <Paper
                                                key={`${merit.name}-${merit.level}-${index}`}
                                                p="sm"
                                                withBorder
                                                style={{
                                                    backgroundColor: paperBg,
                                                    position: "relative"
                                                }}
                                            >
                                                {isFreeMode && !isFromBonus ? (
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => handleDeleteMerit(merit)}
                                                        style={{
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "8px"
                                                        }}
                                                    >
                                                        <IconX size={16} />
                                                    </ActionIcon>
                                                ) : null}
                                                <Group
                                                    justify={
                                                        isFreeMode ? "flex-start" : "space-between"
                                                    }
                                                >
                                                    <Text
                                                        fw={700}
                                                        style={{
                                                            paddingRight: isFreeMode ? "60px" : "0"
                                                        }}
                                                    >
                                                        {getMeritFlawDisplayName(merit)}
                                                    </Text>
                                                    {!isFreeMode ? (
                                                        <Badge color={primaryColor} circle>
                                                            {merit.level}
                                                        </Badge>
                                                    ) : null}
                                                </Group>
                                                {isFreeMode ? (
                                                    <Badge
                                                        color={primaryColor}
                                                        circle
                                                        style={{
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "40px"
                                                        }}
                                                    >
                                                        {merit.level}
                                                    </Badge>
                                                ) : null}
                                                {merit.summary ? (
                                                    <Text size="sm" c="dimmed" mt="xs">
                                                        {merit.summary.charAt(0).toUpperCase() +
                                                            merit.summary.slice(1)}
                                                    </Text>
                                                ) : null}
                                                {isFromBonus ? (
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={primaryColor}
                                                        mt="xs"
                                                    >
                                                        {badgeText}
                                                    </Badge>
                                                ) : null}
                                            </Paper>
                                        )

                                        if (isFromBonus) {
                                            return (
                                                <Tooltip
                                                    key={index}
                                                    label={
                                                        isFromLoresheet
                                                            ? "Added by loresheet"
                                                            : "Added by predator type"
                                                    }
                                                    withArrow
                                                >
                                                    <Box>{meritPaper}</Box>
                                                </Tooltip>
                                            )
                                        }

                                        return meritPaper
                                    }
                                )}
                                {isEditable ? (
                                    <Paper
                                        p="md"
                                        withBorder
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: paperBg
                                        }}
                                    >
                                        <Center style={{ height: "100%" }}>
                                            <ActionIcon
                                                size="xl"
                                                variant="light"
                                                color={primaryColor}
                                                radius="xl"
                                                onClick={() => setMeritModalOpened(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                <IconPlus size={24} />
                                            </ActionIcon>
                                        </Center>
                                    </Paper>
                                ) : null}
                            </Stack>
                        </Grid.Col>
                    ) : null}
                    {allFlaws.length > 0 || isEditable ? (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={4} mb="sm">
                                Flaws
                            </Title>
                            <Stack gap="xs">
                                {allFlaws.map(
                                    (
                                        {
                                            meritFlaw: flaw,
                                            isFromPredatorType,
                                            isUpgradedFromPredatorType,
                                            isFromLoresheet,
                                            isUpgradedFromLoresheet
                                        },
                                        index
                                    ) => {
                                        const isFromBonus = isFromPredatorType || isFromLoresheet
                                        const badgeText = isFromLoresheet
                                            ? isUpgradedFromLoresheet
                                                ? "Upgraded from loresheet"
                                                : "From loresheet"
                                            : isUpgradedFromPredatorType
                                              ? "Upgraded from predator type"
                                              : "From predator type"
                                        const flawPaper = (
                                            <Paper
                                                key={`${flaw.name}-${flaw.level}-${index}`}
                                                p="sm"
                                                withBorder
                                                style={{
                                                    backgroundColor: paperBg,
                                                    position: "relative"
                                                }}
                                            >
                                                {isFreeMode && !isFromBonus ? (
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => handleDeleteFlaw(flaw)}
                                                        style={{
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "8px"
                                                        }}
                                                    >
                                                        <IconX size={16} />
                                                    </ActionIcon>
                                                ) : null}
                                                <Group
                                                    justify={
                                                        isFreeMode ? "flex-start" : "space-between"
                                                    }
                                                >
                                                    <Text
                                                        fw={700}
                                                        style={{
                                                            paddingRight: isFreeMode ? "60px" : "0"
                                                        }}
                                                    >
                                                        {getMeritFlawDisplayName(flaw)}
                                                    </Text>
                                                    {!isFreeMode ? (
                                                        <Badge color="red" circle>
                                                            {flaw.level}
                                                        </Badge>
                                                    ) : null}
                                                </Group>
                                                {isFreeMode ? (
                                                    <Badge
                                                        color="red"
                                                        circle
                                                        style={{
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "40px"
                                                        }}
                                                    >
                                                        {flaw.level}
                                                    </Badge>
                                                ) : null}
                                                {flaw.summary ? (
                                                    <Text size="sm" c="dimmed" mt="xs">
                                                        {flaw.summary.charAt(0).toUpperCase() +
                                                            flaw.summary.slice(1)}
                                                    </Text>
                                                ) : null}
                                                {isFromBonus ? (
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={
                                                            isFromLoresheet ? primaryColor : "red"
                                                        }
                                                        mt="xs"
                                                    >
                                                        {badgeText}
                                                    </Badge>
                                                ) : null}
                                            </Paper>
                                        )

                                        if (isFromBonus) {
                                            return (
                                                <Tooltip
                                                    key={index}
                                                    label={
                                                        isFromLoresheet
                                                            ? "Added by loresheet"
                                                            : "Added by predator type"
                                                    }
                                                    withArrow
                                                >
                                                    <Box>{flawPaper}</Box>
                                                </Tooltip>
                                            )
                                        }

                                        return flawPaper
                                    }
                                )}
                                {isEditable ? (
                                    <Paper
                                        p="md"
                                        withBorder
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: paperBg
                                        }}
                                    >
                                        <Center style={{ height: "100%" }}>
                                            <ActionIcon
                                                size="xl"
                                                variant="light"
                                                color="red"
                                                radius="xl"
                                                onClick={() => setFlawModalOpened(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                <IconPlus size={24} />
                                            </ActionIcon>
                                        </Center>
                                    </Paper>
                                ) : null}
                            </Stack>
                        </Grid.Col>
                    ) : null}
                </Grid>
            </Box>
            <MeritFlawSelectModal
                opened={meritModalOpened}
                onClose={() => setMeritModalOpened(false)}
                options={options}
                type="merit"
            />
            <MeritFlawSelectModal
                opened={flawModalOpened}
                onClose={() => setFlawModalOpened(false)}
                options={options}
                type="flaw"
            />
            <Modal
                opened={!!itemToDelete}
                onClose={() => {
                    setItemToDelete(null)
                }}
                title=""
                centered
                withCloseButton={false}
            >
                <Stack>
                    <Text fz="xl" ta="center">
                        Delete {itemToDelete?.type} &quot;{itemToDelete?.item.name}&quot;?
                    </Text>
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button
                            color="yellow"
                            variant="subtle"
                            onClick={() => {
                                setItemToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default memo(MeritsAndFlaws, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.merits === n.character.merits &&
        p.character.flaws === n.character.flaws &&
        p.character.clan === n.character.clan &&
        p.character.predatorType === n.character.predatorType &&
        p.character.availableDisciplineNames === n.character.availableDisciplineNames &&
        p.character.disciplines === n.character.disciplines &&
        p.character.experience === n.character.experience &&
        p.character.ephemeral.experienceSpent === n.character.ephemeral.experienceSpent
    )
})
