import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core"
import { useState } from "react"
import { Character } from "../../data/Character"
import { Skills, SkillsKey, skillsKeySchema } from "../../data/Skills"
import { Specialty } from "../../data/Specialties"
import { globals } from "../../globals"
import { intersection, lowcase, upcase } from "../utils"

type SpecialtyModalProps = {
    modalOpened: boolean
    closeModal: () => void
    character: Character
    pickedSkillNames: SkillsKey[]
    skills: Skills
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SpecialtySkill = "academics" | "craft" | "performance" | "science"

export const SpecialtyModal = ({
    modalOpened,
    closeModal,
    setCharacter,
    nextStep,
    character,
    pickedSkillNames,
    skills,
}: SpecialtyModalProps) => {
    // TODOdin: Does changing skills reset your specialties? I think it might keep the old ones but as empty strings.
    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen

    const [pickedSkillDisplay, setPickedSkillDisplay] = useState<string>(/*pickedSkillNames[0]*/ "") // Need to define this and set it in parent-component to automatically select the first one (see PredatorTypePicker)
    const [pickedSkillSpecialty, setPickedSkillSpecialty] = useState("")

    const [academicsSpecialty, setAcademicsSpecialty] = useState("")
    const [craftSpecialty, setCraftSpecialty] = useState("")
    const [performanceSpecialty, setPerformanceSpecialty] = useState("")
    const [scienceSpecialty, setScienceSpecialty] = useState("")

    const specialtySkills = ["academics", "craft", "performance", "science"]

    const specialtyStates: Record<SpecialtySkill, { value: string; setValue: (s: string) => void }> = {
        academics: { value: academicsSpecialty, setValue: setAcademicsSpecialty },
        craft: { value: craftSpecialty, setValue: setCraftSpecialty },
        performance: { value: performanceSpecialty, setValue: setPerformanceSpecialty },
        science: { value: scienceSpecialty, setValue: setScienceSpecialty },
    }

    const pickedSpecialtySkills = intersection(specialtySkills, pickedSkillNames) as SpecialtySkill[]
    const pickedSkill = lowcase(pickedSkillDisplay)

    const inputW = phoneScreen ? 140 : 200
    return (
        <Modal
            withCloseButton={false}
            size="lg"
            opened={modalOpened}
            onClose={closeModal}
            title={
                <div>
                    <Text w={smallScreen ? "300px" : "600px"} fw={700} fz={"30px"} ta="center">
                        Specialties
                    </Text>
                    <Text fw={400} fz={"md"} ta="center" mt={"md"} color="grey">
                        Specialties are additional abilities that apply to some uses of a skill (Eg. Performance: Dancing)
                    </Text>
                    <Text fw={400} fz={"md"} ta="center" mt={"md"} color="grey">
                        A specialty should not be so broad that it applies to most uses of the skill
                    </Text>
                </div>
            }
            centered
        >
            <Stack style={{ minHeight: "350px", display: "flex", flexDirection: "column" }}>
                <Divider my="sm" />
                <Text fw={700} fz={"xl"}>
                    Select a Skill for a free Specialty
                </Text>

                <Group justify="space-between">
                    <Select
                        w={inputW}
                        // label="Pick a free specialty"
                        placeholder="Pick one"
                        searchable
                        onSearchChange={setPickedSkillDisplay}
                        searchValue={pickedSkillDisplay}
                        data={pickedSkillNames.filter((s) => !specialtySkills.includes(s)).map(upcase)}
                    />

                    <TextInput
                        w={inputW}
                        value={pickedSkillSpecialty}
                        onChange={(event) => setPickedSkillSpecialty(event.currentTarget.value)}
                    />
                </Group>
                <Divider my="sm" variant="dotted" />

                {pickedSpecialtySkills.map((s) => (
                    <div key={s}>
                        <Group justify="space-between">
                            <Text fw={700} fz={phoneScreen ? "sm" : "xl"}>
                                {upcase(s)}:
                            </Text>
                            <TextInput
                                w={inputW}
                                value={specialtyStates[s].value}
                                onChange={(event) => specialtyStates[s].setValue(event.currentTarget.value)}
                            />
                        </Group>
                        <Divider my="sm" variant="dotted" />
                    </div>
                ))}

                <Group justify="space-between" style={{ marginTop: "auto" }}>
                    <Button color="yellow" variant="subtle" leftSection={<FontAwesomeIcon icon={faChevronLeft} />} onClick={closeModal}>
                        Back
                    </Button>

                    <Button
                        color="grape"
                        onClick={async () => {
                            let pickedSpecialties = specialtySkills.reduce<Specialty[]>((acc, s) => {
                                return [...acc, { skill: skillsKeySchema.parse(s), name: specialtyStates[s as SpecialtySkill].value }]
                            }, [])
                            pickedSpecialties = [
                                ...pickedSpecialties,
                                { skill: skillsKeySchema.parse(pickedSkill), name: lowcase(pickedSkillSpecialty) },
                            ]

                            closeModal()
                            setCharacter({ ...character, skills: skills, skillSpecialties: pickedSpecialties })
                            nextStep()
                        }}
                    >
                        Confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
