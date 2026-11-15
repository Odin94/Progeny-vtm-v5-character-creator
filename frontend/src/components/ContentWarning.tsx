import { Text } from "@mantine/core"
import "./ContentWarning.css"

const ContentWarning = ({ children }: { children: React.ReactNode }) => (
    <aside className="content-warning" aria-label="Content warning">
        <div className="content-warning__body">
            <Text className="content-warning__title">Content warning</Text>
            <Text className="content-warning__text">{children}</Text>
        </div>
    </aside>
)

export default ContentWarning
