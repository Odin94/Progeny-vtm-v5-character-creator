import { Button, CloseButton, Group, Paper, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { globals } from '~/globals';
import { IconCookie } from '@tabler/icons-react';

const LEARN_MORE_HREF = "https://odin-matthias.de/datenschutzerklaerung"

export const CookiesBanner = () => {
    const [showBanner, setShowBanner] = useState(false);
    const isMobile = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`);

    useEffect(() => {
        try {
            const consentStatus = posthog.get_explicit_consent_status();
            setShowBanner(consentStatus === "pending");
        } catch (error) {
            console.warn("Failed to check PostHog consent status:", error);
            setShowBanner(false);
        }
    }, []);

    const handleAccept = () => {
        try {
            posthog.opt_in_capturing();
            setShowBanner(false);
        } catch (error) {
            console.warn("Failed to opt in PostHog capturing:", error);
        }
    };

    const handleDecline = () => {
        try {
            posthog.opt_out_capturing();
            setShowBanner(false);
        } catch (error) {
            console.warn("Failed to opt out PostHog capturing:", error);
        }
    };

    const handleClose = () => {
        setShowBanner(false);
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: "1rem",
                left: isMobile ? "50%" : "25%",
                transform: "translateX(-50%)",
                zIndex: 2500,
                maxWidth: "400px",
                width: "calc(100% - 2rem)",
            }}
        >
            <Paper withBorder p="lg" radius="md" shadow="md">
                <Group justify="space-between" mb="xs">
                    <Group gap="xs" align="center">
                        <Text fz="md" fw={500}>
                            Sink your fangs into some cookies!
                        </Text>
                        <IconCookie size={25} />
                    </Group>
                    <CloseButton mr={-9} mt={-9} aria-label="Close cookie banner" onClick={handleClose} />
                </Group>
                <Text c="dimmed" fz="xs">
                    I use cookies to get better insights on usage patterns, which helps me improve Progeny for everyone.
                    <br /> More info:{" "}
                    <a
                        href={LEARN_MORE_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4 hover:no-underline"
                    >
                        privacy policy
                    </a>
                    .
                </Text>
                <Group justify="space-between" mt="lg" gap={"xl"}>
                    <Button variant="light" size="sm" color="gray" onClick={handleDecline}>
                        Decline
                    </Button>
                    <Button variant="filled" size="sm" color="grape" onClick={handleAccept}>
                        Accept
                    </Button>
                </Group>
            </Paper>
        </div>
    );
}