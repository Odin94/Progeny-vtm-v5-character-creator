import { faFileArrowUp, faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Box, Button, FileButton, ScrollArea, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBrandGithub } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import LoadModal from "../../components/LoadModal"
import CharacterSheetLinkButton from "../../components/CharacterSheetLinkButton"
import { Character } from "../../data/Character"
import { globals } from "../../globals"
import { GeneratorStepId } from "../steps"
import { generatorScrollableAreaStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { SocialIcons } from "./SocialIcons"

type IntroProps = {
    setCharacter: (character: Character) => void
    nextStep: () => void
    setSelectedStep: (step: GeneratorStepId) => void
}

const Intro = ({ setCharacter, nextStep, setSelectedStep }: IntroProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Intro" })
    }, [])

    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)

    const phoneScreen = globals.isPhoneScreen
    const smallScreen = globals.isSmallScreen

    return (
        <div style={{ ...generatorScrollableShellStyle, width: "100%" }}>
            <Stack align="center" gap="md" style={{ ...generatorScrollableAreaStyle, width: "100%" }}>
                <ScrollArea
                    style={generatorScrollableAreaStyle}
                    w="100%"
                    px={smallScreen ? 12 : 20}
                    pt={4}
                    pb={8}
                    scrollbarSize={nightfallScrollbarSize}
                    type="always"
                    offsetScrollbars="present"
                    styles={nightfallScrollAreaStyles}
                >
                    <Stack gap="xl" align="center">
                        <Stack gap={10} align="center" mb={phoneScreen ? 4 : 8} w="100%">
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Cinzel, Georgia, serif",
                                    fontSize: phoneScreen ? "0.72rem" : "0.8rem",
                                    letterSpacing: "0.34em",
                                    textTransform: "uppercase",
                                    color: "rgba(212, 175, 100, 0.75)",
                                }}
                            >
                                Vampire: The Masquerade · V5
                            </Text>
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Crimson Text, Georgia, serif",
                                    fontSize: phoneScreen ? "2.6rem" : "3.4rem",
                                    lineHeight: 1,
                                    color: "rgba(244, 236, 232, 0.96)",
                                    textShadow: "0 2px 28px rgba(224, 49, 49, 0.18)",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "Cinzel, Georgia, serif",
                                        letterSpacing: "0.08em",
                                        color: "rgba(224, 49, 49, 1)",
                                    }}
                                >
                                    Progeny
                                </span>
                            </Text>
                            <div
                                style={{
                                    width: 180,
                                    height: 2,
                                    background:
                                        "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.45) 50%, transparent 100%)",
                                }}
                            />
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Inter, Segoe UI, sans-serif",
                                    fontSize: phoneScreen ? "0.92rem" : "1rem",
                                    letterSpacing: "0.04em",
                                    color: "rgba(214, 204, 198, 0.7)",
                                    maxWidth: 520,
                                }}
                            >
                                A guided character creator for the night eternal. Craft your Kindred, then export them
                                or carry them into play.
                            </Text>
                        </Stack>

                        <Box
                            maw={560}
                            w="100%"
                            px={phoneScreen ? 16 : 24}
                            py={phoneScreen ? 16 : 22}
                            style={{
                                borderRadius: 18,
                                border: "1px solid rgba(125, 91, 72, 0.38)",
                                background:
                                    "linear-gradient(180deg, rgba(30, 21, 24, 0.78) 0%, rgba(18, 13, 16, 0.92) 100%)",
                                boxShadow:
                                    "0 18px 32px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                            }}
                        >
                            <Stack gap="sm">
                                <Text
                                    style={{
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        fontSize: "0.92rem",
                                        lineHeight: 1.55,
                                        color: "rgba(214, 204, 198, 0.78)",
                                    }}
                                >
                                    When you&apos;re finished, download a printable PDF (template kindly provided by{" "}
                                    <a
                                        href="https://linktr.ee/nerdbert"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "rgba(212, 175, 100, 0.95)" }}
                                    >
                                        Nerdbert
                                    </a>
                                    ) or save a JSON file you can re-load later to continue editing.
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        fontSize: "0.82rem",
                                        lineHeight: 1.55,
                                        color: "rgba(214, 204, 198, 0.55)",
                                    }}
                                >
                                    Created under the{" "}
                                    <a
                                        href="https://www.worldofdarkness.com/dark-pack"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "rgba(224, 49, 49, 0.95)" }}
                                    >
                                        Dark Pack License
                                    </a>
                                    .
                                </Text>
                                <Box mt="xs">
                                    <SocialIcons />
                                </Box>
                            </Stack>
                        </Box>

                        <Stack align="center" gap="lg" w="100%">
                            <CharacterSheetLinkButton />

                            <Button
                                leftSection={<FontAwesomeIcon icon={faPlay} />}
                                size="xl"
                                onClick={nextStep}
                                styles={{
                                    root: {
                                        fontFamily: "Cinzel, Georgia, serif",
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        background:
                                            "linear-gradient(180deg, rgba(224, 49, 49, 0.94) 0%, rgba(168, 32, 32, 0.96) 100%)",
                                        border: "1px solid rgba(224, 49, 49, 0.55)",
                                        boxShadow:
                                            "0 10px 28px rgba(224, 49, 49, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                                        transition: "transform 140ms ease, box-shadow 140ms ease",
                                    },
                                    root__hover: {
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                Get Started
                            </Button>

                            <FileButton
                                onChange={async (payload: File | null) => {
                                    if (!payload) return

                                    setLoadedFile(payload)
                                    openLoadModal()
                                }}
                                accept="application/json"
                            >
                                {(props) => (
                                    <Button
                                        leftSection={<FontAwesomeIcon icon={faFileArrowUp} />}
                                        size="md"
                                        variant="outline"
                                        {...props}
                                        styles={{
                                            root: {
                                                fontFamily: "Cinzel, Georgia, serif",
                                                letterSpacing: "0.14em",
                                                textTransform: "uppercase",
                                                borderColor: "rgba(212, 175, 100, 0.45)",
                                                color: "rgba(212, 175, 100, 0.95)",
                                                background: "rgba(212, 175, 100, 0.06)",
                                            },
                                        }}
                                    >
                                        Load From File
                                    </Button>
                                )}
                            </FileButton>
                        </Stack>

                        <div
                            style={{
                                width: 120,
                                height: 1,
                                background:
                                    "linear-gradient(90deg, transparent 0%, rgba(125, 91, 72, 0.55) 50%, transparent 100%)",
                                marginTop: 8,
                            }}
                        />

                        <Stack align="center" gap="sm" pb="xl">
                            <Button
                                component="a"
                                href={CONTACT_LINKS.github.href}
                                target="_blank"
                                rel="noreferrer"
                                leftSection={<IconBrandGithub size={16} />}
                                size="xs"
                                variant="subtle"
                                color="gray"
                                styles={{
                                    root: {
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        letterSpacing: "0.06em",
                                        color: "rgba(214, 204, 198, 0.6)",
                                    },
                                }}
                            >
                                View Source Code
                            </Button>
                            <Button
                                component="a"
                                href={CONTACT_LINKS.kofi.href}
                                target="_blank"
                                rel="noreferrer"
                                leftSection={<span>☕</span>}
                                size="xs"
                                variant="subtle"
                                color="gray"
                                styles={{
                                    root: {
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        letterSpacing: "0.06em",
                                        color: "rgba(212, 175, 100, 0.75)",
                                    },
                                }}
                            >
                                Support on Ko-Fi
                            </Button>
                            <Button
                                component="a"
                                href={CONTACT_LINKS.website.href}
                                target="_blank"
                                rel="noreferrer"
                                size="xs"
                                variant="subtle"
                                color="gray"
                                styles={{
                                    root: {
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        letterSpacing: "0.06em",
                                        color: "rgba(214, 204, 198, 0.45)",
                                    },
                                }}
                            >
                                View My Website
                            </Button>
                        </Stack>
                    </Stack>
                </ScrollArea>
            </Stack>

            <LoadModal
                loadedFile={loadedFile}
                setCharacter={setCharacter}
                loadModalOpened={loadModalOpened}
                closeLoadModal={closeLoadModal}
                setSelectedStep={setSelectedStep}
            />
        </div>
    )
}

export default Intro
