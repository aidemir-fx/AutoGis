import { useEffect, useState } from "react";

export const useCoords = () => {
    const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next: [number, number] = [
                    pos.coords.latitude,
                    pos.coords.longitude,
                ];
                setUserCoords(next);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, [navigator]);

    return { userCoords };
};
