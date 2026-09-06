import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { getAsset } from "@modules/media/api";
import { palette } from "./styles";

export function OrderPhotos({ assetIds }: { assetIds: string[] }) {
    const [urls, setUrls] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        Promise.all(
            assetIds.map((id) =>
                getAsset(id)
                    .then(
                        (asset) =>
                            asset.urls?.medium?.jpeg ||
                            asset.urls?.medium?.webp ||
                            asset.urls?.thumb?.jpeg ||
                            asset.urls?.thumb?.webp ||
                            asset.urls?.original ||
                            null
                    )
                    .catch(() => null)
            )
        ).then((resolved) => {
            if (!cancelled) {
                setUrls(resolved.filter((u): u is string => Boolean(u)));
            }
        });
        return () => {
            cancelled = true;
        };
    }, [assetIds.join(",")]);

    if (urls.length === 0) return null;
    return (
        <Box sx={{ display: "flex", gap: 0.85, flexWrap: "wrap", mt: 1 }}>
            {urls.map((url) => (
                <Box
                    key={url}
                    component="img"
                    src={url}
                    alt="Фото заявки"
                    sx={{
                        width: 84,
                        height: 84,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        border: `1px solid ${palette.border}`,
                    }}
                />
            ))}
        </Box>
    );
}
