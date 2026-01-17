import { Box, Group, Stack, Text } from "@mantine/core"
import successIcon from "~/resources/diceResults/success.svg"
import criticalIcon from "~/resources/diceResults/critical.svg"
import bloodSuccessIcon from "~/resources/diceResults/blood-success.svg"
import bloodCriticalIcon from "~/resources/diceResults/blood-critical.svg"
import bestialFailureIcon from "~/resources/diceResults/bestial-failure.svg"

type SuccessResult = {
    type: "success" | "critical" | "blood-success" | "blood-critical" | "bestial-failure"
    value: number
}

type SuccessResultsProps = {
    results: SuccessResult[]
    totalSuccesses: number
    primaryColor: string
}

const SuccessResults = ({ results, totalSuccesses, primaryColor }: SuccessResultsProps) => {
    return (
        <Box
            style={{
                border: `1px solid ${primaryColor}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                minHeight: "150px",
                maxHeight: "150px",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
            }}
        >
            <Stack gap="sm" style={{ flex: 1 }}>
                <Text fw={700} fz="md" c={primaryColor}>
                    Successes:
                </Text>
                {results.length > 0 ? (
                    <>
                        <Group gap="xs" wrap="wrap">
                            {results.map((result, index) => {
                                let iconSrc: string
                                switch (result.type) {
                                    case "success":
                                        iconSrc = successIcon
                                        break
                                    case "critical":
                                        iconSrc = criticalIcon
                                        break
                                    case "blood-success":
                                        iconSrc = bloodSuccessIcon
                                        break
                                    case "blood-critical":
                                        iconSrc = bloodCriticalIcon
                                        break
                                    case "bestial-failure":
                                        iconSrc = bestialFailureIcon
                                        break
                                }
                                return (
                                    <img
                                        key={index}
                                        src={iconSrc}
                                        alt={result.type}
                                        style={{ width: "40px", height: "40px" }}
                                    />
                                )
                            })}
                        </Group>
                        <Text fw={600} fz="lg">
                            Total Successes: {totalSuccesses}
                        </Text>
                    </>
                ) : (
                    <Text c="dimmed">No successes</Text>
                )}
            </Stack>
        </Box>
    )
}

export default SuccessResults
