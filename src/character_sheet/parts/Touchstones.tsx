import { Box, Grid, Paper, Text, Title } from "@mantine/core"
import { SheetOptions } from "../constants"

type TouchstonesProps = {
    options: SheetOptions
}

const Touchstones = ({ options }: TouchstonesProps) => {
    const { character, primaryColor } = options
    if (character.touchstones.length === 0) {
        return null
    }

    return (
        <Box>
            <Title order={2} mb="md" c={primaryColor}>
                Touchstones
            </Title>
            <Grid>
                {character.touchstones.map((touchstone, index) => (
                    <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                        <Paper p="sm" withBorder>
                            <Text fw={700}>{touchstone.name}</Text>
                            {touchstone.description ? (
                                <Text size="sm" c="dimmed" mt="xs">
                                    {touchstone.description}
                                </Text>
                            ) : null}
                            {touchstone.conviction ? (
                                <Text size="sm" mt="xs">
                                    <Text span fw={700}>
                                        Conviction:
                                    </Text>{" "}
                                    {touchstone.conviction}
                                </Text>
                            ) : null}
                        </Paper>
                    </Grid.Col>
                ))}
            </Grid>
        </Box>
    )
}

export default Touchstones
