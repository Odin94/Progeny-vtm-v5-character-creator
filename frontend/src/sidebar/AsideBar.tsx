import { Button, Group, Loader, ScrollArea, Stepper, Stack } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Character, containsBloodSorcery } from "../data/Character"
import { isDefault, upcase } from "../generator/utils"
import { globals } from "../globals"
import { isBackendDisabled } from "../utils/backend"
import { useAuth } from "../hooks/useAuth"

export type AsideBarProps = {
    selectedStep: number
    setSelectedStep: (step: number) => void
    character: Character
}

const AsideBar = ({ selectedStep, setSelectedStep, character }: AsideBarProps) => {
    const { loading: authLoading, isAuthenticated, signIn } = useAuth()
    // const smallScreen = globals.isSmallScreen
    const maybeRituals = containsBloodSorcery(character.disciplines) ? ["rituals"] : []
    const stepperKeys = [
        "clan",
        "attributes",
        "skills",
        "generation",
        "predatorType",
        "name",
        "disciplines",
        ...maybeRituals,
        "touchstones",
        "merits",
    ] as (keyof Character)[]

    const isHigherLevelAccessible = (character: Character, key: keyof Character) => {
        const index = Math.max(0, stepperKeys.indexOf(key) - 1) // if n-1 is not default then we can jump to n

        for (let i = index; i < stepperKeys.length; i++) {
            if (!isDefault(character, stepperKeys[i])) return true
        }
        return false
    }

    const getStepper = () => {
        return (
            <Stepper
                color="grape"
                orientation="vertical"
                active={selectedStep}
                onStepClick={(x) => {
                    setSelectedStep(x)
                }}
            >
                <Stepper.Step key={"Intro"} label={"Intro"} description="">
                    {" "}
                </Stepper.Step>
                {stepperKeys.map((title) => {
                    return (
                        <Stepper.Step
                            key={title}
                            label={upcase(title)}
                            description=""
                            disabled={!isHigherLevelAccessible(character, title)}
                        >
                            {" "}
                        </Stepper.Step>
                    )
                })}
                <Stepper.Step key={"Final"} label={"Final"} description="" disabled={isDefault(character, "disciplines")}>
                    {" "}
                </Stepper.Step>
            </Stepper>
        )
    }

    const height = globals.viewportHeightPx
    const scrollerHeight = 940
    return (
        <Stack gap="md" style={{ padding: "1rem", zIndex: 0, height: "100%" }}>
            {!isBackendDisabled() ? (
                <Stack gap="sm">
                    {authLoading ? (
                        <Button size="sm" color="gray" variant="outline" loading leftSection={<IconArrowRight size={16} />}>
                            Loading...
                        </Button>
                    ) : !isAuthenticated ? (
                        <Button size="sm" color="grape" variant="outline" leftSection={<IconArrowRight size={16} />} onClick={signIn}>
                            Sign In
                        </Button>
                    ) : (
                        <Button
                            component="a"
                            href="/me"
                            size="sm"
                            color="grape"
                            variant="outline"
                            leftSection={<IconArrowRight size={16} />}
                        >
                            Account
                        </Button>
                    )}
                    <Button
                        component="a"
                        href="/sheet"
                        size="sm"
                        color="grape"
                        variant="outline"
                        leftSection={<IconArrowRight size={16} />}
                    >
                        Sheet
                    </Button>
                </Stack>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                {height <= scrollerHeight ? <ScrollArea h={height - 100}>{getStepper()}</ScrollArea> : <>{getStepper()}</>}
            </div>
        </Stack>
    )
}

export default AsideBar
