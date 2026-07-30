import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button } from "@mantine/core"
import { motion, useReducedMotion } from "framer-motion"

const CharacterSheetLinkButton = () => {
    const shouldReduceMotion = useReducedMotion()

    const handleClick = () => {
        window.history.pushState({}, "", "/sheet")
        window.location.reload()
    }

    return (
        <motion.div
            initial={{
                opacity: 0,
                transform: shouldReduceMotion ? "none" : "scale(0.97)"
            }}
            animate={{ opacity: 1, transform: "none" }}
            transition={{
                duration: shouldReduceMotion ? 0.12 : 0.24,
                ease: [0.23, 1, 0.32, 1]
            }}
            style={{ position: "relative", display: "inline-block" }}
        >
            <style>{`
                .character-sheet-link-button {
                    position: relative;
                    z-index: 1;
                    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
                }

                @media (hover: hover) and (pointer: fine) {
                    .character-sheet-link-button:hover {
                        transform: scale(1.02);
                        box-shadow: 0 0 30px 8px rgba(200, 50, 150, 0.3), 0 0 60px 15px rgba(200, 50, 150, 0.2);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .character-sheet-link-button {
                        transition: box-shadow 120ms cubic-bezier(0.23, 1, 0.32, 1);
                    }

                    .character-sheet-link-button:hover {
                        transform: none;
                    }
                }
            `}</style>
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "-3px",
                    borderRadius: "var(--mantine-radius-md)",
                    zIndex: 0,
                    padding: "3px",
                    background:
                        "conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)"
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "var(--mantine-color-dark-8)",
                        borderRadius: "calc(var(--mantine-radius-md) - 3px)"
                    }}
                />
            </div>
            <div className="character-sheet-link-button">
                <Button
                    leftSection={<FontAwesomeIcon icon={faMagicWandSparkles} />}
                    size="xl"
                    color="grape"
                    variant="gradient"
                    gradient={{ from: "red", to: "grape", deg: 90 }}
                    onClick={handleClick}
                    style={{ position: "relative", overflow: "visible" }}
                >
                    Online Character Sheet
                </Button>
            </div>
            <div
                style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "50px",
                    height: "50px",
                    overflow: "hidden",
                    zIndex: 3,
                    pointerEvents: "none"
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "-12px",
                        width: "70px",
                        height: "20px",
                        backgroundColor: "#c41e3a",
                        transform: "rotate(45deg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                    }}
                >
                    <span
                        style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                        }}
                    >
                        NEW
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

export default CharacterSheetLinkButton
