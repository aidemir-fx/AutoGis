import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { CustomModal } from "@common/components/CustomModal";
import { MasterDetailsScreen } from "@screens/master-details/MasterDetails";

import { Filters, GeolocationPrompt, MasterStatus } from "@modules/masters";
import {
    ActivityType,
    DEFAULT_SEARCH_RADIUS,
    Provider,
    ProvidersMap,
} from "@modules/providers";
import { AppActivityTypes } from "@modules/providers/features/ActivityTypeFilters/constants";
import { fetchCombinedProviders } from "@modules/providers/api";
import { ProviderShowcaseCard } from "@modules/providers/features/ProviderShowcaseCard";
import { ErrorState } from "@common/components";
import { LogoIcon, MapPinIcon, UserIcon } from "@common/icons";
import { useAuth, useCoords, useQueryParams, useUserProfile } from "@common/hooks";
import { RadiusPickerModal } from "./components/RadiusPickerModal";
import { MobileProviderPeekCard } from "./components/MobileProviderPeekCard";
import { MobileBottomSummary } from "./components/MobileBottomSummary";
import {
    ActivityChip,
    AvailableFilterChip,
    AvailableGrid,
    AvailableSection,
    BrandLogo,
    BrandMark,
    CarouselHead,
    CarouselMeta,
    CarouselSection,
    CarouselTitle,
    CarouselTrack,
    ContentFlow,
    CounterDot,
    CounterLine,
    EmptyCard,
    ErrorWrapper,
    FiltersStrip,
    FloatingSegmentButton,
    FloatingViewSwitcher,
    HeroCopy,
    HeroGrid,
    HeroMapCard,
    HomeShell,
    LoadingPanel,
    MapAttentionMarker,
    MapWrapper,
    MobileChipsStrip,
    MobileHeaderContainer,
    MobileListHeader,
    MobileListViewport,
    MobileMapViewport,
    MobileSearchRow,
    MobileShowSummaryFab,
    MobileTopRow,
    PageRoot,
    ProfileButton,
    RadiusPill,
    SearchPanel,
    TopActions,
    TopBar,
} from "./styles";

type ProviderCategory = {
    type: ActivityType;
    title: string;
    chip: string;
    empty: string;
};

const PROVIDER_CATEGORIES: ProviderCategory[] = [
    {
        type: ActivityType.master,
        title: "Частные мастера",
        chip: "Частные",
        empty: "Пока нет частных мастеров в выбранном радиусе.",
    },
    {
        type: ActivityType.auto_service,
        title: "Автосервисы",
        chip: "Автосервисы",
        empty: "Автосервисы не найдены. Попробуйте увеличить радиус.",
    },
    {
        type: ActivityType.auto_wash,
        title: "Автомойки",
        chip: "Автомойки",
        empty: "Автомоек рядом пока не найдено.",
    },
    {
        type: ActivityType.auto_shop,
        title: "Автомагазины",
        chip: "Магазины",
        empty: "Автомагазинов рядом пока не найдено.",
    },
];

const DEFAULT_CENTER: [number, number] = [43.21564479600424, 46.89458462676669];
const MAP_FOCUS_ZOOM = 17;
const MAP_FOCUS_DURATION = 650;
const MAP_SCROLL_FOCUS_MAX_WAIT = 1800;
const MAP_SCROLL_STABLE_FRAMES = 6;
const MAP_ATTENTION_AFTER_FOCUS_DELAY = 120;
const MAP_ATTENTION_VISIBLE_DURATION = 1280;

function isElementFocusedInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    if (rect.height <= 0 || rect.width <= 0) {
        return false;
    }

    const elementCenter = rect.top + rect.height / 2;
    const hasVisibleCenter =
        elementCenter >= 0 && elementCenter <= window.innerHeight;
    const isMostlyOnscreen =
        rect.top <= window.innerHeight * 0.72 &&
        rect.bottom >= window.innerHeight * 0.28;

    return hasVisibleCenter || isMostlyOnscreen;
}

function normalizeActivityTypes(value: unknown): ActivityType[] {
    if (!value) {
        return [];
    }

    const rawValue = Array.isArray(value) ? value.join(",") : String(value);
    return rawValue
        .split(",")
        .filter((type): type is ActivityType =>
            Object.values(ActivityType).includes(type as ActivityType)
        )
        .sort();
}

function getProviderText(provider: Provider): string {
    return [
        provider.fullName,
        provider.name,
        provider.businessName,
        provider.address,
        provider.description,
        ...(provider.professions || []),
        ...(provider.services || []),
        ...(provider.autoMarks || []),
        ...(provider.brandSupport || []),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function filterByQuery(providers: Provider[], query: string[]): Provider[] {
    const terms = query.map((item) => item.trim().toLowerCase()).filter(Boolean);

    if (terms.length === 0) {
        return providers;
    }

    return providers.filter((provider) => {
        const haystack = getProviderText(provider);
        return terms.every((term) => haystack.includes(term));
    });
}

function countAvailable(providers: Provider[]): number {
    return providers.reduce((count, provider) => {
        const visibleStatus = provider.currentStatus || provider.status;
        return visibleStatus === MasterStatus.AVAILABLE ? count + 1 : count;
    }, 0);
}

function getInitials(name?: string | null): string {
    if (!name) {
        return "AG";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

export const MainpPageScreen = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileViewMode, setMobileViewMode] = useState<"map" | "list">("map");
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [selectedMobileProvider, setSelectedMobileProvider] = useState<Provider | null>(null);
    const [isRadiusPickerOpen, setIsRadiusPickerOpen] = useState(false);
    const [isMobileSummaryDismissed, setIsMobileSummaryDismissed] = useState(false);
    const [selectedProviderForDetails, setSelectedProviderForDetails] = useState<Provider | null>(null);

    useEffect(() => {
        (window as any).handleProviderClick = (id: string, type: string) => {
            setSelectedProviderForDetails({ id, activityType: type } as any);
        };
        return () => {
            delete (window as any).handleProviderClick;
        };
    }, []);
const [query, setQuery] = useState<string[]>([]);
    const [isMapAttentionVisible, setIsMapAttentionVisible] = useState(false);
    const [mapAttentionKey, setMapAttentionKey] = useState(0);
    const mastersRef = useRef<Record<string, any>>({});
    const mapRef = useRef<HTMLDivElement>(null);
    const yandexMapRef = useRef<any>(null);
    const mapAttentionTimeoutRef = useRef<number | null>(null);
    const mapFocusFrameRef = useRef<number | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { profile } = useUserProfile({ enabled: isAuthenticated });
    const { userCoords } = useCoords();
    const { params, setParam } = useQueryParams();

    const [lat, lng] = userCoords ?? DEFAULT_CENTER;
    const radius = params.radius
        ? parseFloat(params.radius as string)
        : DEFAULT_SEARCH_RADIUS;

    const selectedActivityTypes = useMemo(
        () => normalizeActivityTypes(params.activityTypes),
        [params.activityTypes]
    );

    const activeTypes = useMemo(
        () =>
            selectedActivityTypes.length > 0
                ? selectedActivityTypes
                : (AppActivityTypes as ActivityType[]),
        [selectedActivityTypes]
    );

    const isAllTypesActive = selectedActivityTypes.length === 0;

    const { data, isLoading, error, isError, refetch } = useQuery({
        queryKey: [
            "combined-providers",
            lat,
            lng,
            radius,
        ],
        queryFn: () => fetchCombinedProviders(lat, lng, radius),
        enabled: true,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const nearbyAfterSearch = useMemo(
        () => filterByQuery(data?.nearbyProviders ?? [], query),
        [data?.nearbyProviders, query]
    );

    const allAfterSearch = useMemo(
        () => filterByQuery(data?.allProviders ?? [], query),
        [data?.allProviders, query]
    );

    const filteredNearbyProviders = useMemo(
        () =>
            nearbyAfterSearch.filter((provider) =>
                activeTypes.includes(provider.activityType || ActivityType.master)
            ),
        [activeTypes, nearbyAfterSearch]
    );

    const filteredAllProviders = useMemo(
        () =>
            allAfterSearch.filter((provider) =>
                activeTypes.includes(provider.activityType || ActivityType.master)
            ),
        [activeTypes, allAfterSearch]
    );

    const displayedNearbyProviders = useMemo(() => {
        if (!onlyAvailable) return filteredNearbyProviders;
        return filteredNearbyProviders.filter(
            (provider) =>
                (provider.currentStatus || provider.status) ===
                MasterStatus.AVAILABLE
        );
    }, [filteredNearbyProviders, onlyAvailable]);

    const displayedAllProviders = useMemo(() => {
        if (!onlyAvailable) return filteredAllProviders;
        return filteredAllProviders.filter(
            (provider) =>
                (provider.currentStatus || provider.status) ===
                MasterStatus.AVAILABLE
        );
    }, [filteredAllProviders, onlyAvailable]);

    const providersByType = useMemo(() => {
        return PROVIDER_CATEGORIES.reduce(
            (acc, category) => {
                acc[category.type] = displayedNearbyProviders.filter(
                    (provider) =>
                        (provider.activityType || ActivityType.master) ===
                        category.type
                );
                return acc;
            },
            {} as Record<ActivityType, Provider[]>
        );
    }, [displayedNearbyProviders]);

    const countsByType = useMemo(() => {
        return PROVIDER_CATEGORIES.reduce(
            (acc, category) => {
                acc[category.type] = nearbyAfterSearch.filter(
                    (provider) =>
                        (provider.activityType || ActivityType.master) ===
                        category.type
                ).length;
                return acc;
            },
            {} as Record<ActivityType, number>
        );
    }, [nearbyAfterSearch]);

    const categoriesToRender = useMemo(
        () =>
            PROVIDER_CATEGORIES.filter((category) =>
                activeTypes.includes(category.type)
            ),
        [activeTypes]
    );

    const availableProviders = useMemo(
        () =>
            filteredNearbyProviders.filter(
                (provider) =>
                    (provider.currentStatus || provider.status) ===
                    MasterStatus.AVAILABLE
            ),
        [filteredNearbyProviders]
    );

    const availableCount = availableProviders.length;

    const clearMapAttentionTimers = useCallback(() => {
        if (mapAttentionTimeoutRef.current !== null) {
            window.clearTimeout(mapAttentionTimeoutRef.current);
            mapAttentionTimeoutRef.current = null;
        }

        if (mapFocusFrameRef.current !== null) {
            window.cancelAnimationFrame(mapFocusFrameRef.current);
            mapFocusFrameRef.current = null;
        }
    }, []);

    const hideMapAttention = useCallback(() => {
        clearMapAttentionTimers();
        setIsMapAttentionVisible(false);
    }, [clearMapAttentionTimers]);

    const showMapAttention = useCallback(() => {
        if (mapAttentionTimeoutRef.current !== null) {
            window.clearTimeout(mapAttentionTimeoutRef.current);
        }

        setMapAttentionKey((key) => key + 1);
        setIsMapAttentionVisible(true);
        mapAttentionTimeoutRef.current = window.setTimeout(() => {
            setIsMapAttentionVisible(false);
            mapAttentionTimeoutRef.current = null;
        }, MAP_ATTENTION_VISIBLE_DURATION);
    }, []);

    const focusMapOnCoordinates = useCallback((coordinates: [number, number]) => {
        try {
            yandexMapRef.current?.container?.fitToViewport?.();
            yandexMapRef.current?.setCenter(coordinates, MAP_FOCUS_ZOOM, {
                duration: MAP_FOCUS_DURATION,
                checkZoomRange: true,
            });
        } catch (_) {
            try {
                yandexMapRef.current?.setCenter(coordinates, MAP_FOCUS_ZOOM);
            } catch (_) {}
        }
    }, []);

    const scheduleMapAttentionAfterFocus = useCallback(
        (coordinates: [number, number]) => {
            const mapElement = mapRef.current;

            if (!mapElement) {
                focusMapOnCoordinates(coordinates);
                mapAttentionTimeoutRef.current = window.setTimeout(() => {
                    showMapAttention();
                }, MAP_FOCUS_DURATION + MAP_ATTENTION_AFTER_FOCUS_DELAY);
                return;
            }

            const startedAt = window.performance.now();
            let lastScrollY = window.scrollY;
            let stableFrames = 0;

            const waitForMapFocus = () => {
                const now = window.performance.now();
                const currentScrollY = window.scrollY;
                const scrollDelta = Math.abs(currentScrollY - lastScrollY);

                stableFrames =
                    scrollDelta < 1 ? stableFrames + 1 : 0;
                lastScrollY = currentScrollY;

                const elapsed = now - startedAt;
                const isMapFocused = isElementFocusedInViewport(mapElement);
                const isScrollSettled =
                    stableFrames >= MAP_SCROLL_STABLE_FRAMES;
                const isMapMoveSettled = elapsed >= MAP_FOCUS_DURATION;
                const timedOut = elapsed >= MAP_SCROLL_FOCUS_MAX_WAIT;

                if (
                    (isMapFocused && isScrollSettled && isMapMoveSettled) ||
                    timedOut
                ) {
                    mapFocusFrameRef.current = null;
                    focusMapOnCoordinates(coordinates);
                    mapAttentionTimeoutRef.current = window.setTimeout(() => {
                        showMapAttention();
                    }, MAP_FOCUS_DURATION + MAP_ATTENTION_AFTER_FOCUS_DELAY);
                    return;
                }

                mapFocusFrameRef.current =
                    window.requestAnimationFrame(waitForMapFocus);
            };

            mapFocusFrameRef.current = window.requestAnimationFrame(waitForMapFocus);
        },
        [focusMapOnCoordinates, showMapAttention]
    );

    useEffect(() => {
        return () => {
            clearMapAttentionTimers();
        };
    }, [clearMapAttentionTimers]);

    const handleProviderClick = useCallback((provider: Provider) => {
        const coordinates: [number, number] = [
            provider.coordinates.x,
            provider.coordinates.y,
        ];

        setSelectedMobileProvider(provider);
        hideMapAttention();

        if (isMobile) {
            focusMapOnCoordinates(coordinates);
            showMapAttention();
        } else {
            mapRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            scheduleMapAttentionAfterFocus(coordinates);
        }
    }, [focusMapOnCoordinates, hideMapAttention, isMobile, scheduleMapAttentionAfterFocus, showMapAttention]);

    const handleSelectRadius = useCallback((newRadius: number) => {
        setParam("radius", newRadius.toString());
    }, [setParam]);

    const handleAllTypesClick = useCallback(() => {
        setParam("activityTypes", null);
    }, [setParam]);

    const handleActivityTypeClick = useCallback(
        (type: ActivityType) => {
            if (isAllTypesActive) {
                setParam("activityTypes", type);
                return;
            }

            const next = activeTypes.includes(type)
                ? activeTypes.filter((item) => item !== type)
                : [...activeTypes, type];

            setParam(
                "activityTypes",
                next.length === 0 || next.length === AppActivityTypes.length
                    ? null
                    : next.join(",")
            );
        },
        [activeTypes, isAllTypesActive, setParam]
    );

    const providersErrorMessage = useMemo(() => {
        if (!error) {
            return "Не удалось загрузить список специалистов.";
        }

        if (isAxiosError(error) && error.code === "ERR_NETWORK") {
            return "Не удалось подключиться к серверу. Проверьте, что backend запущен и доступен на порту 3001.";
        }

        return "Не удалось загрузить список специалистов. Попробуйте обновить страницу.";
    }, [error]);

    return (
        <PageRoot>
            {isMobile ? (
                <>
                    <MobileHeaderContainer>
                        <MobileTopRow>
                            <BrandMark href="/" aria-label="Автогис">
                                <BrandLogo src={LogoIcon} alt="Автогис" />
                            </BrandMark>

                            <TopActions>
                                <ProfileButton
                                    aria-label={
                                        isAuthenticated ? "Профиль" : "Войти в профиль"
                                    }
                                    onClick={() =>
                                        navigate(isAuthenticated ? "/cabinet" : "/login")
                                    }
                                >
                                    {isAuthenticated
                                        ? getInitials(profile?.name)
                                        : "Войти"}
                                </ProfileButton>
                            </TopActions>
                        </MobileTopRow>

                        <MobileSearchRow>
                            <Filters
                                query={query}
                                onChange={(next) => setQuery(next.query)}
                            />
                        </MobileSearchRow>

                        <MobileChipsStrip>
                            <ActivityChip
                                $isActive={isAllTypesActive}
                                onClick={handleAllTypesClick}
                            >
                                Все
                                <span>{nearbyAfterSearch.length}</span>
                            </ActivityChip>
                            {PROVIDER_CATEGORIES.map((category) => (
                                <ActivityChip
                                    key={category.type}
                                    $isActive={
                                        !isAllTypesActive &&
                                        activeTypes.includes(category.type)
                                    }
                                    onClick={() =>
                                        handleActivityTypeClick(category.type)
                                    }
                                >
                                    {category.chip}
                                    <span>{countsByType[category.type] || 0}</span>
                                </ActivityChip>
                            ))}
                            <AvailableFilterChip
                                $isActive={onlyAvailable}
                                onClick={() => setOnlyAvailable(!onlyAvailable)}
                            >
                                <span className="dot" />
                                <span>Свободны</span>
                                <span style={{ opacity: 0.75, fontSize: 11 }}>
                                    ({availableCount})
                                </span>
                            </AvailableFilterChip>
                        </MobileChipsStrip>
                    </MobileHeaderContainer>

                    {isError && !data ? (
                        <ErrorWrapper>
                            <ErrorState
                                message={providersErrorMessage}
                                onRetry={() => {
                                    void refetch();
                                }}
                            />
                        </ErrorWrapper>
                    ) : mobileViewMode === "map" ? (
                        <>
                            <MobileMapViewport ref={mapRef}>
                                <ProvidersMap
        masters={displayedAllProviders}
        mastersRef={mastersRef}
        mapInstanceRef={yandexMapRef}
        isLoading={isLoading}
        height="100%"
        onSelectMaster={(provider) => {
            if (isMobile) {
                setSelectedMobileProvider(provider);
            }
        }}
    />
                                {isMapAttentionVisible && (
                                    <MapAttentionMarker
                                        key={mapAttentionKey}
                                        aria-hidden="true"
                                    />
                                )}

                                </MobileMapViewport>
                            {selectedMobileProvider && (
                                <MobileProviderPeekCard
                                    provider={selectedMobileProvider}
                                    onClose={() => setSelectedMobileProvider(null)}
                                    onDetailsClick={(provider: any) => {
                                        setSelectedMobileProvider(null);
                                        setSelectedProviderForDetails(provider);
                                    }}
                                />
                            )}

                            {!selectedMobileProvider && (
                                <div style={{ padding: "0 12px" }}>
                                    {!isMobileSummaryDismissed ? (
                                        <MobileBottomSummary
                                            totalCount={displayedNearbyProviders.length}
                                            availableCount={availableCount}
                                            radius={radius}
                                            providers={displayedNearbyProviders}
                                            onSelectProvider={(p) => {
                                                setSelectedMobileProvider(p);
                                                focusMapOnCoordinates([
                                                    p.coordinates.x,
                                                    p.coordinates.y,
                                                ]);
                                            }}
                                            onSwitchToList={() => setMobileViewMode("list")}
                                            onOpenRadiusPicker={() =>
                                                setIsRadiusPickerOpen(true)
                                            }
                                            onClose={() => setIsMobileSummaryDismissed(true)}
                                        />
                                    ) : (
                                        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 24px" }}>
                                            <MobileShowSummaryFab
                                                onClick={() => setIsMobileSummaryDismissed(false)}
                                                aria-label="Показать карточки специалистов"
                                            >
                                                <span>📍</span>
                                                <span>
                                                    Рядом <b>{displayedNearbyProviders.length}</b>
                                                </span>
                                                <span style={{ fontSize: "11px", color: "#64748b" }}>▲</span>
                                            </MobileShowSummaryFab>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <MobileListViewport>
                            <MobileListHeader>
                                <span>
                                    Найдено{" "}
                                    <b>{displayedNearbyProviders.length}</b>{" "}
                                    специалистов
                                </span>
                                {availableCount > 0 && (
                                    <span className="avail">
                                        ● {availableCount} доступны
                                    </span>
                                )}
                            </MobileListHeader>

                            {isLoading ? (
                                <LoadingPanel>
                                    Загрузка специалистов...
                                </LoadingPanel>
                            ) : displayedNearbyProviders.length > 0 ? (
                                displayedNearbyProviders.map((provider) => (
                                    <ProviderShowcaseCard onDetailsClick={(provider) => setSelectedProviderForDetails(provider)}
                                        key={`mobile-list-${provider.activityType}-${provider.id}`}
                                        provider={provider}
                                        onShowOnMap={handleProviderClick}
                                    />
                                ))
                            ) : (
                                <EmptyCard>
                                    {onlyAvailable
                                        ? "Нет свободных специалистов по вашему фильтру. Попробуйте отключить фильтр 'Свободны' или увеличить радиус."
                                        : "В выбранном радиусе специалисты не найдены. Попробуйте изменить фильтры или увеличить радиус поиска."}
                                </EmptyCard>
                            )}
                        </MobileListViewport>
                    )}
                </>
            ) : (
                <HomeShell>
                    <TopBar>
                        <BrandMark href="/" aria-label="Автогис">
                            <BrandLogo src={LogoIcon} alt="Автогис" />
                        </BrandMark>
                        <TopActions>
                            <ProfileButton
                                aria-label={
                                    isAuthenticated ? "Профиль" : "Войти в профиль"
                                }
                                onClick={() =>
                                    navigate(isAuthenticated ? "/cabinet" : "/login")
                                }
                            >
                                {isAuthenticated
                                    ? getInitials(profile?.name)
                                    : "Войти"}
                            </ProfileButton>
                        </TopActions>
                    </TopBar>

                    {isError && !data ? (
                        <ErrorWrapper>
                            <ErrorState
                                message={providersErrorMessage}
                                onRetry={() => {
                                    void refetch();
                                }}
                            />
                        </ErrorWrapper>
                    ) : (
                        <>
                            <HeroGrid>
                                <HeroCopy>
                                    <SearchPanel>
                                        <Filters
                                            query={query}
                                            onChange={(next) =>
                                                setQuery(next.query)
                                            }
                                        />
                                    </SearchPanel>
                                </HeroCopy>

                                <HeroMapCard ref={mapRef}>
                                    <MapWrapper>
                                        <ProvidersMap
                                            masters={displayedAllProviders}
                                            mastersRef={mastersRef}
                                            mapInstanceRef={yandexMapRef}
                                            isLoading={isLoading}
                                            height="418px"
                                        />
                                        {isMapAttentionVisible && (
                                            <MapAttentionMarker
                                                key={mapAttentionKey}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </MapWrapper>
                                </HeroMapCard>
                            </HeroGrid>

                            <FiltersStrip>
                                <ActivityChip
                                    $isActive={isAllTypesActive}
                                    onClick={handleAllTypesClick}
                                >
                                    Все
                                    <span>{nearbyAfterSearch.length}</span>
                                </ActivityChip>
                                {PROVIDER_CATEGORIES.map((category) => (
                                    <ActivityChip
                                        key={category.type}
                                        $isActive={
                                            !isAllTypesActive &&
                                            activeTypes.includes(category.type)
                                        }
                                        onClick={() =>
                                            handleActivityTypeClick(category.type)
                                        }
                                    >
                                        {category.chip}
                                        <span>
                                            {countsByType[category.type] || 0}
                                        </span>
                                    </ActivityChip>
                                ))}
                                <AvailableFilterChip
                                    $isActive={onlyAvailable}
                                    onClick={() => setOnlyAvailable(!onlyAvailable)}
                                >
                                    <span className="dot" />
                                    <span>Свободны сейчас</span>
                                    <span style={{ opacity: 0.75, fontSize: 11 }}>
                                        ({availableCount})
                                    </span>
                                </AvailableFilterChip>
                            </FiltersStrip>

                            <CounterLine>
                                <span>
                                    <b>{displayedNearbyProviders.length}</b> рядом
                                </span>
                                <CounterDot />
                                <span className="ok">
                                    <b>{availableCount}</b> доступны сейчас
                                </span>
                                <CounterDot />
                                <RadiusPill
                                    onClick={() => setIsRadiusPickerOpen(true)}
                                    aria-label="Изменить радиус"
                                    style={{ margin: 0, padding: "3px 10px" }}
                                >
                                    <MapPinIcon />
                                    <span>{radius} км</span>
                                    <span style={{ opacity: 0.6 }}>▾</span>
                                </RadiusPill>
                            </CounterLine>

                            {isLoading ? (
                                <LoadingPanel>
                                    Загрузка предложений...
                                </LoadingPanel>
                            ) : (
                                <ContentFlow>
                                    {categoriesToRender.map((category) => {
                                        const providers =
                                            providersByType[category.type] || [];
                                        const categoryAvailable =
                                            countAvailable(providers);

                                        return (
                                            <CarouselSection key={category.type}>
                                                <CarouselHead>
                                                    <CarouselTitle>
                                                        {category.title}
                                                    </CarouselTitle>
                                                    <CarouselMeta>
                                                        {providers.length} рядом ·{" "}
                                                        {categoryAvailable} доступно
                                                    </CarouselMeta>
                                                </CarouselHead>
                                                <CarouselTrack>
                                                    {providers.length > 0 ? (
                                                        providers.map((provider) => (
                                                            <ProviderShowcaseCard onDetailsClick={(provider) => setSelectedProviderForDetails(provider)}
                                                                key={`${provider.activityType}-${provider.id}`}
                                                                provider={provider}
                                                                onShowOnMap={
                                                                    handleProviderClick
                                                                }
                                                            />
                                                        ))
                                                    ) : (
                                                        <EmptyCard>
                                                            {category.empty}
                                                        </EmptyCard>
                                                    )}
                                                </CarouselTrack>
                                            </CarouselSection>
                                        );
                                    })}

                                    <AvailableSection>
                                        <CarouselHead>
                                            <CarouselTitle>
                                                Доступные сейчас
                                            </CarouselTitle>
                                            <CarouselMeta>
                                                {availableProviders.length} вариантов
                                            </CarouselMeta>
                                        </CarouselHead>
                                        {availableProviders.length > 0 ? (
                                            <AvailableGrid>
                                                {availableProviders.map(
                                                    (provider) => (
                                                        <ProviderShowcaseCard onDetailsClick={(provider) => setSelectedProviderForDetails(provider)}
                                                            key={`available-${provider.activityType}-${provider.id}`}
                                                            provider={provider}
                                                            onShowOnMap={
                                                                handleProviderClick
                                                            }
                                                        />
                                                    )
                                                )}
                                            </AvailableGrid>
                                        ) : (
                                            <EmptyCard>
                                                Сейчас нет доступных вариантов в
                                                выбранном радиусе.
                                            </EmptyCard>
                                        )}
                                    </AvailableSection>
                                </ContentFlow>
                            )}
                        </>
                    )}
                </HomeShell>
            )}

            <RadiusPickerModal
                open={isRadiusPickerOpen}
                onClose={() => setIsRadiusPickerOpen(false)}
                currentRadius={radius}
                onSelectRadius={handleSelectRadius}
            />

            <GeolocationPrompt />
                        <CustomModal
                isOpen={!!selectedProviderForDetails}
                onClose={() => setSelectedProviderForDetails(null)}
            >
                {selectedProviderForDetails && (
                    <MasterDetailsScreen
                        providerId={selectedProviderForDetails.id}
                        providerType={selectedProviderForDetails.activityType}
                        isModal={true}
                    />
                )}
            </CustomModal>
        </PageRoot>
    );
};