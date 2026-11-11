import { Button } from "@mantine/core"
import { IconArrowLeft, IconDroplet, IconMapPinOff } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { EmptyState, PageShell, Panel } from "~/components/ui"

/** Root `notFoundComponent`: themed 404 inside the standard page frame. */
const NotFoundPage = () => (
    <PageShell size="sm">
        <Panel tone="ornate" p={{ base: "lg", sm: "xl" }} mt={{ base: 0, sm: "xl" }} grain>
            <EmptyState
                icon={<IconMapPinOff size={26} stroke={1.5} />}
                title="Page not found"
                description="Nothing stirs at this address. The link may be old, or the page has moved."
                actions={
                    <>
                        <Button
                            component={Link}
                            to="/"
                            variant="default"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Back home
                        </Button>
                        <Button
                            component={Link}
                            to="/create"
                            color="red"
                            leftSection={<IconDroplet size={16} />}
                        >
                            Create a character
                        </Button>
                    </>
                }
            />
        </Panel>
    </PageShell>
)

export default NotFoundPage
