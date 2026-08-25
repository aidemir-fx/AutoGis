import { useState, useEffect } from "react";

export const useLogic = () => {
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [isButtonLoading, setIsButtonLoading] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setIsPromptVisible(true);
            return;
        }

        // Check if permission is granted
        navigator.permissions
            .query({ name: "geolocation" })
            .then((result) => {
                if (result.state === "granted") {
                    setIsPromptVisible(false);
                } else if (result.state === "denied") {
                    setIsPromptVisible(true);
                } else {
                    setIsPromptVisible(true);
                }
            })
            .catch(() => {
                // Fallback for browsers that don't support permissions API
                navigator.geolocation.getCurrentPosition(
                    () => {
                        setIsPromptVisible(false);
                    },
                    () => {
                        setIsPromptVisible(true);
                    },
                    { timeout: 10000 }
                );
            });
    }, []);

    const requestGeolocationAccess = () => {
        setIsButtonLoading(true);
        setTimeout(() => {
            hidePrompt();
            setIsButtonLoading(false);
        }, 1000);
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            () => {
                setIsPromptVisible(false);
            },
            () => {
                // Still denied, keep prompt visible
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    const hidePrompt = () => {
        setIsPromptVisible(false);
    };

    return {
        isPromptVisible,
        requestGeolocationAccess,
        hidePrompt,
        isButtonLoading,
    };
};
