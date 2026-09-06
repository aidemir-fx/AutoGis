import { useState } from "react";
import { styled } from "styled-components";
import { Provider } from "@modules/providers";
import { MasterStatus } from "@modules/masters";
import { formatDistanceFromUser } from "@common/lib/formatDistance";
import { CrossIcon, StarIcon } from "@common/icons";

interface MobileBottomSummaryProps {
    totalCount: number;
    availableCount: number;
    radius: number;
    providers: Provider[];
    onSelectProvider: (provider: Provider) => void;
    onSwitchToList: () => void;
    onOpenRadiusPicker: () => void;
    onClose?: () => void;
}

const SummaryWrapper = styled.div<{ $collapsed?: boolean }>`
    width: 100%;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(226, 232, 240, 0.9);
    padding: ${({ $collapsed }) => ($collapsed ? "10px 14px" : "12px 14px 14px")};
    margin-top: 12px;
    margin-bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 24px);
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
`;

const TopRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

const CountInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
    cursor: pointer;
`;

const MainCountText = styled.span`
    font-size: 13.5px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;

    b {
        color: #2563eb;
    }
`;

const SubCountText = styled.span`
    font-size: 11px;
    color: #16a34a;
    font-weight: 600;
    line-height: 1.2;
`;

const ActionControls = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
`;

const RadiusBadgeButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 4px 9px;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;

    &:hover {
        background: #dbeafe;
    }
`;

const ToggleCollapseButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #f1f5f9;
        color: #0f172a;
    }
`;

const CloseButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;

    svg {
        width: 14px;
        height: 14px;
    }

    &:hover {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #ef4444;
    }
`;

const MiniCardsScroll = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 2px;
    max-height: 280px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
`;

const MiniCard = styled.div`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px 10px;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &:hover {
        border-color: #3b82f6;
        transform: translateY(-1px);
    }
`;

const MiniCardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 7px;
    margin-bottom: 2px;
`;

const MiniAvatar = styled.div`
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    overflow: hidden;
    background: #f1f5f9;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 800;
    color: #2563eb;
    margin-top: 1px;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const MiniStatusDot = styled.span<{ $available: boolean }>`
    position: absolute;
    bottom: 0;
    right: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $available }) => ($available ? "#16a34a" : "#9ca3af")};
    border: 1px solid #ffffff;
`;

const MiniInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const MiniName = styled.span`
    font-size: 11.5px;
    font-weight: 750;
    color: #0f172a;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.2;
    word-break: break-word;
`;

const MiniSubtitle = styled.span`
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 1px;
    margin-bottom: 3px;
    word-break: break-word;
`;

const MiniMeta = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
`;

const MiniRating = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-weight: 700;
    color: #b45309;

    svg {
        width: 11px;
        height: 11px;
        fill: #f59e0b;
        color: #f59e0b;
    }
`;

const MiniDistance = styled.span`
    font-weight: 600;
    color: #2563eb;
`;

export const MobileBottomSummary = ({
    totalCount,
    availableCount,
    radius,
    providers,
    onSelectProvider,
    onOpenRadiusPicker,
    onClose,
}: MobileBottomSummaryProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const previewList = providers.slice(0, 10);

    return (
        <SummaryWrapper $collapsed={isCollapsed}>
            <TopRow>
                <CountInfo
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    role="button"
                    tabIndex={0}
                    aria-label={isCollapsed ? "Развернуть карточки специалистов" : "Свернуть карточки специалистов"}
                >
                    <MainCountText>
                        Рядом <b>{totalCount}</b> специалистов
                    </MainCountText>
                    <SubCountText>
                        {availableCount > 0
                            ? `● ${availableCount} доступны прямо сейчас`
                            : "Все специалисты на карте"}
                    </SubCountText>
                </CountInfo>

                <ActionControls>
                    <RadiusBadgeButton
                        onClick={onOpenRadiusPicker}
                        aria-label="Изменить радиус"
                    >
                        📍 {radius} км ▾
                    </RadiusBadgeButton>
                    <ToggleCollapseButton
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        title={isCollapsed ? "Развернуть" : "Свернуть"}
                        aria-label={isCollapsed ? "Развернуть" : "Свернуть"}
                    >
                        {isCollapsed ? "▲" : "▼"}
                    </ToggleCollapseButton>
                    {onClose && (
                        <CloseButton
                            onClick={onClose}
                            title="Скрыть окно"
                            aria-label="Скрыть окно"
                        >
                            <CrossIcon />
                        </CloseButton>
                    )}
                </ActionControls>
            </TopRow>

            {!isCollapsed && previewList.length > 0 && (
                <MiniCardsScroll>
                    {previewList.map((p) => {
                        const name =
                            p.fullName || p.businessName || p.name || "Мастер";
                        const isAvail =
                            (p.currentStatus || p.status) ===
                            MasterStatus.AVAILABLE;
                        const dist = formatDistanceFromUser(p.distance);

                        return (
                            <MiniCard
                                key={`mini-${p.id}`}
                                onClick={() => onSelectProvider(p)}
                            >
                                <MiniCardHeader>
                                    <MiniAvatar>
                                        {p.avatar || p.avatarUrl || p.coverImageUrl || p.coverImage ? (
                                            <img
                                                src={p.avatar || p.avatarUrl || p.coverImageUrl || p.coverImage}
                                                alt={name}
                                            />
                                        ) : (
                                            name[0]?.toUpperCase() || "M"
                                        )}
                                        <MiniStatusDot $available={isAvail} />
                                    </MiniAvatar>
                                    <MiniName title={name}>{name}</MiniName>
                                </MiniCardHeader>
                                <MiniMeta>
                                    <MiniRating>
                                        <StarIcon />
                                        {(p.rating || 0).toFixed(1)}
                                    </MiniRating>
                                    {dist && (
                                        <MiniDistance>{dist}</MiniDistance>
                                    )}
                                </MiniMeta>
                            </MiniCard>
                        );
                    })}
                </MiniCardsScroll>
            )}
        </SummaryWrapper>
    );
};
