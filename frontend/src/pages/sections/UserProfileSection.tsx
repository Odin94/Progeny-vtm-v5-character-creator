import { Button, Group, Switch, TextInput, VisuallyHidden } from "@mantine/core"
import { IconEdit, IconEye, IconEyeOff, IconSparkles } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import NameTag from "~/components/NameTag"
import { IconButton, Panel } from "~/components/ui"
import classes from "../me/me.module.css"

type UserProfileSectionProps = {
    user: {
        email?: string | null
        firstName?: string | null
        lastName?: string | null
        nickname?: string | null
        nameTagEnabled: boolean
        nameTagVisible: boolean
    } | null
    isEditingNickname: boolean
    setIsEditingNickname: (value: boolean) => void
    isUpdatingProfile: boolean
    /** @deprecated Kept for call-site compatibility; colors come from the theme. */
    redColorValue?: string
    handleSaveNickname: (nickname: string) => void
    handleCancelNickname: () => void
    handleNameTagToggle: (visible: boolean) => void
}

const UserProfileSection = ({
    user,
    isEditingNickname,
    setIsEditingNickname,
    isUpdatingProfile,
    handleSaveNickname,
    handleCancelNickname,
    handleNameTagToggle
}: UserProfileSectionProps) => {
    const [nicknameValue, setNicknameValue] = useState(user?.nickname || "")
    useEffect(() => {
        setNicknameValue(user?.nickname || "")
    }, [user?.nickname, isEditingNickname])
    const [emailVisible, setEmailVisible] = useState(false)
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    const nameTagLabel = user?.nickname || fullName || "Player"

    return (
        <section aria-labelledby="me-profile-title">
            <VisuallyHidden component="h2" id="me-profile-title">
                Profile
            </VisuallyHidden>
            <div className={classes.profile}>
                <Panel p="lg">
                    <div className={classes.fields}>
                        <div className={classes.field}>
                            <span className={classes.fieldLabel}>Email</span>
                            <div className={classes.fieldValue}>
                                <span className={emailVisible ? undefined : classes.fieldMuted}>
                                    {emailVisible
                                        ? (user?.email ?? "No email available")
                                        : "Hidden"}
                                </span>
                                <IconButton
                                    size="sm"
                                    label={emailVisible ? "Hide email" : "Show email"}
                                    icon={
                                        emailVisible ? (
                                            <IconEyeOff size={16} />
                                        ) : (
                                            <IconEye size={16} />
                                        )
                                    }
                                    onClick={() => setEmailVisible((current) => !current)}
                                />
                            </div>
                        </div>

                        {fullName ? (
                            <div className={classes.field}>
                                <span className={classes.fieldLabel}>Name</span>
                                <div className={classes.fieldValue}>{fullName}</div>
                            </div>
                        ) : null}

                        <div className={classes.field}>
                            <span className={classes.fieldLabel}>Nickname</span>
                            {isEditingNickname ? (
                                <form
                                    className={classes.fieldValue}
                                    onSubmit={(event) => {
                                        event.preventDefault()
                                        handleSaveNickname(nicknameValue)
                                    }}
                                >
                                    <TextInput
                                        value={nicknameValue}
                                        onChange={(e) => setNicknameValue(e.target.value)}
                                        placeholder="Enter nickname"
                                        aria-label="Nickname"
                                        maxLength={255}
                                        disabled={isUpdatingProfile}
                                        autoFocus
                                        style={{ flex: "1 1 200px" }}
                                    />
                                    <Group gap="xs">
                                        <Button type="submit" loading={isUpdatingProfile}>
                                            Save
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            onClick={handleCancelNickname}
                                            disabled={isUpdatingProfile}
                                        >
                                            Cancel
                                        </Button>
                                    </Group>
                                </form>
                            ) : (
                                <div className={classes.fieldValue}>
                                    <span
                                        className={user?.nickname ? undefined : classes.fieldMuted}
                                    >
                                        {user?.nickname || "No nickname set"}
                                    </span>
                                    <IconButton
                                        size="sm"
                                        label="Edit nickname"
                                        icon={<IconEdit size={16} />}
                                        onClick={() => setIsEditingNickname(true)}
                                    />
                                </div>
                            )}
                        </div>

                        {user?.nameTagEnabled ? (
                            <div className={classes.field}>
                                <span className={classes.fieldLabel}>Name tag</span>
                                <div className={classes.fieldValue}>
                                    <Switch
                                        checked={user.nameTagVisible}
                                        disabled={isUpdatingProfile}
                                        onChange={(event) =>
                                            handleNameTagToggle(event.currentTarget.checked)
                                        }
                                        label="Show my name tag to other players"
                                        description="Adds a highlighted player tag beside your name in chats and coteries."
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Panel>

                <Panel tone="inset" className={classes.tagPreview}>
                    <span className="pg-eyebrow">How others see you</span>
                    {user?.nameTagEnabled && user.nameTagVisible ? (
                        <NameTag name={nameTagLabel} size="md" />
                    ) : (
                        <span className={classes.rowName}>{nameTagLabel}</span>
                    )}
                    <p className={classes.tagPreviewNote}>
                        {user?.nickname
                            ? "Your nickname appears in coteries, chats and shares."
                            : "Set a nickname so other players can share characters with you."}
                    </p>
                    {!user?.nickname && !isEditingNickname ? (
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconSparkles size={14} />}
                            onClick={() => setIsEditingNickname(true)}
                        >
                            Choose a nickname
                        </Button>
                    ) : null}
                </Panel>
            </div>
        </section>
    )
}

export default UserProfileSection
