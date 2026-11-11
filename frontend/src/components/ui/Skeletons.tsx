import { Group, SimpleGrid, Skeleton, Stack, type SimpleGridProps } from "@mantine/core"
import { Panel } from "./Panel"

/**
 * Loading placeholders that reserve the space of the content they stand in for, so the page
 * does not reflow when data arrives. Match the real layout's height as closely as you can.
 */

export const SkeletonLines = ({
    lines = 3,
    lastLineWidth = "60%",
    height = 10,
    gap = 10
}: {
    lines?: number
    lastLineWidth?: string
    height?: number
    gap?: number
}) => (
    <Stack gap={gap} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
            <Skeleton
                key={index}
                height={height}
                radius="sm"
                width={index === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
            />
        ))}
    </Stack>
)

/** A card-shaped placeholder: title line, two body lines, optional footer row. */
export const SkeletonCard = ({
    height,
    withFooter = false
}: {
    height?: number
    withFooter?: boolean
}) => (
    <Panel tone="plain" p="lg" h={height} aria-hidden="true">
        <Stack gap="md" h="100%">
            <Skeleton height={16} width="45%" radius="sm" />
            <SkeletonLines lines={2} />
            {withFooter ? (
                <Group gap="xs" mt="auto">
                    <Skeleton height={28} width={88} radius="md" />
                    <Skeleton height={28} width={64} radius="md" />
                </Group>
            ) : null}
        </Stack>
    </Panel>
)

/** Grid of `SkeletonCard`s — mirror the real grid's `cols`. */
export const SkeletonGrid = ({
    count = 6,
    cols = { base: 1, sm: 2, lg: 3 },
    cardHeight = 160,
    spacing = "md"
}: {
    count?: number
    cols?: SimpleGridProps["cols"]
    cardHeight?: number
    spacing?: SimpleGridProps["spacing"]
}) => (
    <SimpleGrid cols={cols} spacing={spacing} aria-busy="true">
        {Array.from({ length: count }, (_, index) => (
            <SkeletonCard key={index} height={cardHeight} />
        ))}
    </SimpleGrid>
)

/** List row placeholder: avatar/icon, two lines, trailing action. */
export const SkeletonRow = ({ withAvatar = true }: { withAvatar?: boolean }) => (
    <Group gap="md" wrap="nowrap" py="xs" aria-hidden="true">
        {withAvatar ? <Skeleton height={36} circle /> : null}
        <Stack gap={8} style={{ flex: 1 }}>
            <Skeleton height={12} width="40%" radius="sm" />
            <Skeleton height={10} width="70%" radius="sm" />
        </Stack>
        <Skeleton height={28} width={28} radius="md" />
    </Group>
)

export const SkeletonList = ({ rows = 4 }: { rows?: number }) => (
    <Stack gap={4} aria-busy="true">
        {Array.from({ length: rows }, (_, index) => (
            <SkeletonRow key={index} />
        ))}
    </Stack>
)
