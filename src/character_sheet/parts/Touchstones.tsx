import { Box, Grid, Paper, Text, Title, useMantineTheme } from "@mantine/core"
import { SheetOptions } from "../constants"
import { bgAlpha, hexToRgba } from "../utils/style"

type TouchstonesProps = {
    options: SheetOptions
}

const Touchstones = ({ options }: TouchstonesProps) => {
    const { character, primaryColor } = options
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
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
                        <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
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
