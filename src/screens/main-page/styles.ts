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
    padding: 0 10px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #f1f5f9;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;

    svg {
        width: 18px;
        height: 18px;
        color: #2563eb;
    }

    &:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
    }
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

export const MobileHeaderContainer = styled.header`
    position: sticky;
    top: 0;
    z-index: 1020;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    padding: 10px 14px 8px;
`;

export const MobileTopRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
`;

export const RadiusPill = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    padding: 6px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
    }

    svg {
        width: 12px;
        height: 12px;
        color: #2563eb;
    }
`;

export const MobileSearchRow = styled.div`
    width: 100%;
    margin-bottom: 8px;

    .MuiAutocomplete-root {
        width: 100%;
    }

    .MuiOutlinedInput-root {
        background: #f8fafc;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 13.5px;
    }
`;

export const MobileChipsStrip = styled.div`
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;

    &::-webkit-scrollbar {
        display: none;
    }
`;

export const AvailableFilterChip = styled.button<{ $isActive: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid ${({ $isActive }) => ($isActive ? "#16a34a" : "#e2e8f0")};
    background: ${({ $isActive }) => ($isActive ? "#f0fdf4" : "#ffffff")};
    color: ${({ $isActive }) => ($isActive ? "#15803d" : "#475569")};
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #16a34a;
        box-shadow: ${({ $isActive }) =>
            $isActive ? "0 0 0 3px rgba(22, 163, 74, 0.25)" : "none"};
    }
`;

export const FloatingViewSwitcher = styled.div`
    position: fixed;
    bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 12px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1200;
    display: inline-flex;
    align-items: center;
    padding: 4px;
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 999px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

export const FloatingSegmentButton = styled.button<{ $isActive: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    border: none;
    background: ${({ $isActive }) => ($isActive ? "#2563eb" : "transparent")};
    color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#cbd5e1")};
    font-size: 12.5px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;

    span.badge {
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        font-size: 11px;
        background: ${({ $isActive }) =>
            $isActive ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)"};
        padding: 1px 6px;
        border-radius: 999px;
    }

    &:active {
        transform: scale(0.96);
    }
`;

export const MobileMapViewport = styled.div`
    position: relative;
    width: 100%;
    height: 280px;
    min-height: 260px;
    overflow: hidden;
    background: #e2e8f0;
    border-bottom: 1px solid #cbd5e1;

    .ymaps-2-1-79-map {
        width: 100% !important;
        height: 100% !important;
    }
`;

export const MobileListViewport = styled.div`
    padding: 12px 14px calc(56px + env(safe-area-inset-bottom, 0px) + 80px);
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const MobileListHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 4px 6px;
    font-size: 13px;
    color: #64748b;
    font-weight: 600;

    b {
        color: #0f172a;
    }

    .avail {
        color: #16a34a;
        font-weight: 700;
    }
`;

export const MobileShowSummaryFab = styled.button`
    position: absolute;
    bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 64px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1050;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    color: #0f172a;
    border: 1px solid rgba(203, 213, 225, 0.9);
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 700;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

    b {
        color: #2563eb;
    }

    &:hover {
        background: #ffffff;
        border-color: #93c5fd;
        transform: translateX(-50%) translateY(-1px);
    }

    &:active {
        transform: translateX(-50%) scale(0.97);
    }
`;

