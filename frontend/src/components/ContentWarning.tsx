import { IconAlertTriangle } from "@tabler/icons-react"
import "./ContentWarning.css"

const ContentWarning = ({ children }: { children: React.ReactNode }) => (
    <aside className="content-warning" aria-label="Content warning">
        <div className="content-warning__body">
            <p className="content-warning__title">
                <IconAlertTriangle size={15} stroke={1.8} aria-hidden="true" />
                Content warning
            </p>
            <p className="content-warning__text">{children}</p>
        </div>
    </aside>
)

export default ContentWarning
