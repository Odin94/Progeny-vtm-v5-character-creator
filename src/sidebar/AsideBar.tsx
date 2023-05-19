
import { Aside, Center, Stepper } from "@mantine/core"
import { Character } from "../data/Character"
import { isDefault, upcase } from "../generator/utils"



export type AsideBarProps = {
    selectedStep: number,
    setSelectedStep: (step: number) => void,
    character: Character
}

const stepperKeys = ["clan", "attributes", "skills", "generation", "predatorType", "name", "disciplines", "touchstones", "merits"] as (keyof Character)[]


const isHigherLevelAccessible = (character: Character, key: keyof Character) => {
    const index = Math.max(0, stepperKeys.indexOf(key) - 1)  // if n-1 is not default then we can jump to n

    for (let i = index; i < stepperKeys.length; i++) {
        if (!isDefault(character, stepperKeys[i])) return true
    }
    return false
}

const AsideBar = ({ selectedStep, setSelectedStep, character }: AsideBarProps) => {
    return (
        <Aside p="md" hiddenBreakpoint="sm" width={{ sm: 200, xs: 50 }} style={{ zIndex: 0 }}>
            <Center h={"100%"}>
                <Stepper color="grape" orientation="vertical" active={selectedStep} onStepClick={setSelectedStep} breakpoint="sm">
                    <Stepper.Step key={"Intro"} label={"Intro"} description=""> </Stepper.Step>
                    {stepperKeys.map((title) => {
                        return (<Stepper.Step key={title} label={upcase(title)} description="" disabled={!isHigherLevelAccessible(character, title)}> </Stepper.Step>)
                    })}
                    <Stepper.Step key={"Final"} label={"Final"} description="" disabled={isDefault(character, "disciplines")}> </Stepper.Step>
                </Stepper>
            </Center>
        </Aside>
    )
}


export default AsideBar