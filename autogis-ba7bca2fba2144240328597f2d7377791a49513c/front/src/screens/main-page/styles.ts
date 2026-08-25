import { ActivityType } from "@modules/providers";
import { styled } from "styled-components";

export const PageRoot = styled.div`
    min-height: 100vh;
    background: #fafafa;
    color: #111827;
`;

export const HomeShell = styled.div`
    width: 100%;
    max-width: 1320px;
    margin: 0 auto;
    padding: 18px 40px 118px;

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 0 0 96px;
    }
`;

export const TopBar = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 4px 18px;

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 14px 18px 10px;
    }
`;

export const BrandMark = styled.a`
    display: inline-flex;
    align-items: center;
    min-height: 40px;
`;

export const BrandLogo = styled.img`
    display: block;
    width: 120px;
    height: auto;
`;

export const TopActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const ProfileButton = styled.button`
    min-width: 40px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: #111827;
    color: #3b82f6;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12px;
    font-weight: 800;
`;

export const HeroGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 24px;
    align-items: stretch;
    margin-bottom: 18px;

    ${({ theme }) => theme.breakpoints.down("lg")} {
        grid-template-columns: 1fr;
    }

    ${({ theme }) => theme.breakpoints.down("md")} {
        display: block;
        margin-bottom: 0;
    }
`;

export const HeroCopy = styled.section`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    min-height: 380px;
    padding: 30px;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #ffffff;

    ${({ theme }) => theme.breakpoints.down("md")} {
        min-height: auto;
        padding: 4px 20px 14px;
        border: 0;
        border-radius: 0;
        background: transparent;
    }
`;

export const SearchPanel = styled.div`
    width: 100%;
    max-width: 620px;

    .MuiAutocomplete-root {
        width: 100%;
    }

    input {
        font-size: 14px;
    }
`;

export const HeroMapCard = styled.section`
    position: relative;
    min-height: 418px;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #eef2f7;
    overflow: hidden;

    ${({ theme }) => theme.breakpoints.down("md")} {
        min-height: 418px;
        margin: 0 18px 18px;
    }
`;

export const MapWrapper = styled.div`
    position: absolute;
    inset: 0;

    .ymaps-2-1-79-inner-panes,
    .ymaps-2-1-79-map {
        border-radius: 18px;
    }
`;

export const MapAttentionMarker = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 4;
    width: 74px;
    height: 74px;
    pointer-events: none;
    transform: translate(-50%, calc(-50% - 24px));
    animation: map-attention-bob 1280ms cubic-bezier(0.2, 0.75, 0.22, 1) both;

    &::before,
    &::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 999px;
    }

    &::before {
        border: 2px solid rgba(59, 130, 246, 0.76);
        background: rgba(59, 130, 246, 0.08);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.88),
            0 14px 34px rgba(37, 99, 235, 0.24);
        animation: map-attention-ring 1280ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
    }

    &::after {
        inset: 26px;
        background: #3b82f6;
        box-shadow:
            0 0 0 6px rgba(59, 130, 246, 0.18),
            0 0 0 10px rgba(255, 255, 255, 0.52);
        animation: map-attention-core 1280ms ease-out both;
    }

    @keyframes map-attention-bob {
        0% {
            transform: translate(-50%, calc(-50% - 24px)) scale(0.9);
            opacity: 0;
        }
        14% {
            opacity: 1;
        }
        34% {
            transform: translate(calc(-50% - 4px), calc(-50% - 30px))
                scale(1.02);
        }
        56% {
            transform: translate(calc(-50% + 3px), calc(-50% - 27px))
                scale(1);
        }
        100% {
            transform: translate(-50%, calc(-50% - 24px)) scale(0.96);
            opacity: 0;
        }
    }

    @keyframes map-attention-ring {
        0% {
            transform: scale(0.48);
            opacity: 0;
        }
        18% {
            opacity: 0.94;
        }
        100% {
            transform: scale(1.52);
            opacity: 0;
        }
    }

    @keyframes map-attention-core {
        0% {
            transform: scale(0.6);
            opacity: 0;
        }
        18%,
        68% {
            opacity: 1;
        }
        100% {
            transform: scale(0.78);
            opacity: 0;
        }
    }
`;

export const FiltersStrip = styled.div`
    display: flex;
    gap: 8px;
    padding: 0 4px 14px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 0 18px 14px;
    }
`;

export const ActivityChip = styled.button<{ $isActive: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 9px 14px;
    border: 1px solid ${({ $isActive }) => ($isActive ? "#111827" : "#e5e7eb")};
    border-radius: 999px;
    background: ${({ $isActive }) => ($isActive ? "#111827" : "#ffffff")};
    color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#111827")};
    font-size: 12.5px;
    font-weight: 750;
    white-space: nowrap;

    span {
        color: ${({ $isActive }) =>
            $isActive ? "rgba(255,255,255,0.62)" : "#6b7280"};
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        font-size: 11px;
    }
`;

export const CounterLine = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px;
    padding: 0 8px 22px;
    color: #6b7280;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 11.5px;

    b {
        color: #111827;
    }

    .ok {
        color: #1d4ed8;
    }

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 4px 22px 18px;
    }
`;

export const CounterDot = styled.span`
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #9ca3af;
`;

export const ContentFlow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 26px;
`;

export const CarouselSection = styled.section``;

export const CarouselHead = styled.div`
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 0 4px 12px;

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 0 20px 12px;
    }
`;

export const CarouselTitle = styled.h2`
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0;
`;

export const CarouselMeta = styled.span`
    color: #6b7280;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 11px;

    &::before {
        content: "·";
        margin: 0 6px;
        color: #9ca3af;
    }
`;

export const CarouselTrack = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    overflow-x: auto;
    padding: 4px 4px 12px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }

    > * {
        scroll-snap-align: start;
    }

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 4px 18px 12px;
    }
`;

export const EmptyCard = styled.div`
    width: 280px;
    min-width: 280px;
    min-height: 220px;
    border: 1px dashed #cbd5e1;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #ffffff;
    color: #6b7280;
    text-align: center;
    font-size: 13px;
    line-height: 1.5;
`;

export const AvailableSection = styled.section`
    padding: 2px 4px 0;

    ${({ theme }) => theme.breakpoints.down("md")} {
        padding: 0 18px;
    }
`;

export const AvailableGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    align-items: start;
    gap: 12px;

    > article {
        justify-self: start;
    }
`;

export const LoadingPanel = styled.div`
    display: grid;
    place-items: center;
    min-height: 220px;
    color: #6b7280;
    font-size: 14px;
`;

export const ErrorWrapper = styled.div`
    padding: 24px 18px;
`;

export const TypeAccent = styled.span<{ $type: ActivityType }>`
    color: ${({ $type }) =>
        $type === ActivityType.master
            ? "#1d4ed8"
            : $type === ActivityType.auto_wash
              ? "#0891b2"
              : $type === ActivityType.auto_shop
                ? "#475569"
                : "#111827"};
`;
