import { Button, ScrollArea, Stack, Stepper } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { Character } from "../data/Character"
import { GeneratorStepId, getGeneratorStepIndex, getVisibleGeneratorSteps } from "../generator/steps"
import { isDefault } from "../generator/utils"
import { globals } from "../globals"
import { useAuth } from "../hooks/useAuth"

export type AsideBarProps = {
    selectedStep: GeneratorStepId
    setSelectedStep: (step: GeneratorStepId) => void
    character: Character
}

const AsideBar = ({ selectedStep, setSelectedStep, character }: AsideBarProps) => {
    const { isLoading: authLoading, isAuthenticated, signIn } = useAuth()
    const steps = getVisibleGeneratorSteps(character)

    const isHigherLevelAccessible = (character: Character, step: (typeof steps)[number]) => {
        if (!step.progressKey) {
            return true
        }

        const stepperKeys = steps
            .map((candidateStep) => candidateStep.progressKey)
            .filter((value): value is NonNullable<typeof value> => value !== undefined)
        const index = Math.max(0, stepperKeys.indexOf(step.progressKey) - 1) // if n-1 is not default then we can jump to n

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
                active={getGeneratorStepIndex(character, selectedStep)}
                onStepClick={(x) => {
                    const nextStep = steps[x]
                    if (nextStep) {
                        setSelectedStep(nextStep.id)
                    }
                }}
            >
                {steps.map((step) => {
                    return (
                        <Stepper.Step
                            key={step.id}
                            label={step.label}
                            description=""
                            disabled={!isHigherLevelAccessible(character, step)}
                        >
                            {" "}
                        </Stepper.Step>
                    )
                })}
            </Stepper>
        )
    }

    const height = globals.viewportHeightPx
    const scrollerHeight = 940
    return (
        <Stack gap="md" style={{ padding: "1rem", zIndex: 0, height: "100%" }}>
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
                    <Button component={Link} to="/me" size="sm" color="grape" variant="outline" leftSection={<IconArrowRight size={16} />}>
                        Account
                    </Button>
                )}
                <Button component={Link} to="/sheet" size="sm" color="grape" variant="outline" leftSection={<IconArrowRight size={16} />}>
                    Sheet
                </Button>
            </Stack>
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                {height <= scrollerHeight ? <ScrollArea h={height - 100}>{getStepper()}</ScrollArea> : <>{getStepper()}</>}
            </div>
        </Stack>
    )
}

export default AsideBar
