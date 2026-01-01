import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button } from "@mantine/core"
import { motion } from "framer-motion"
import { useMemo, useState } from "react"

const CharacterSheetLinkButton = () => {
    const [isHovered, setIsHovered] = useState(false)

    const handleClick = () => {
        window.history.pushState({}, "", "/sheet")
        window.location.reload()
    }

    // Generate random particle positions and delays
    const particles = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 100 - 10, // -10% to 110% to extend beyond button
            y: Math.random() * 100 - 10,
            delay: Math.random() * 2,
            duration: 1.5 + Math.random() * 1,
        }))
    }, [])

    return (
        <motion.div
            style={{ position: "relative", display: "inline-block" }}
            animate={{
                scale: [1, 1.05, 1],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {/* Animated rainbow border */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: "-3px",
                    borderRadius: "var(--mantine-radius-md)",
                    zIndex: 0,
                    padding: "3px",
                }}
                animate={{
                    background: [
                        "conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)",
                        "conic-gradient(from 360deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)",
                    ],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "var(--mantine-color-dark-8)",
                        borderRadius: "calc(var(--mantine-radius-md) - 3px)",
                    }}
                />
            </motion.div>
            <motion.div
                style={{
                    position: "relative",
                    zIndex: 1,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{
                    boxShadow: "0 0 30px 8px rgba(200, 50, 150, 0.3), 0 0 60px 15px rgba(200, 50, 150, 0.2)",
                }}
                transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                }}
            >
                <Button
                    leftSection={
                        <motion.div
                            animate={{
                                rotate: isHovered ? [0, -12, 12, 0] : 0,
                            }}
                            transition={{
                                duration: 3,
                                ease: "easeInOut",
                                repeat: isHovered ? Infinity : 0,
                                repeatType: "reverse",
                            }}
                        >
                            <FontAwesomeIcon icon={faMagicWandSparkles} />
                        </motion.div>
                    }
                    size="xl"
                    color="grape"
                    variant="gradient"
                    gradient={{ from: "red", to: "grape", deg: 90 }}
                    onClick={handleClick}
                    style={{
                        position: "relative",
                        overflow: "visible",
                        transform: "scale(1)",
                    }}
                >
                    Online Character Sheet
                </Button>
            </motion.div>
            {/* Sparkly particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    style={{
                        position: "absolute",
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        boxShadow: "0 0 6px 2px rgba(255, 255, 255, 0.8), 0 0 12px 4px rgba(255, 215, 0, 0.6)",
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                    animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
            {/* Diagonal NEW ribbon */}
            <div
                style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "50px",
                    height: "50px",
                    overflow: "hidden",
                    zIndex: 3,
                    pointerEvents: "none",
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
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <span
                        style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
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
