import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthLayout } from "@modules/layout/features/AuthLayout";
import { Master, MasterAccountHeader } from "@modules/masters";
import { fetchProviderByTypeAndId } from "@modules/providers/api";
import { ActivityType } from "@modules/providers";
import { Card } from "@common/components";
import {
    Container,
    StyledCardContent,
    BoxWrapper,
    StyledCardHeader,
    MapWrapper,
    SpecializationSection,
    SpecializationTags,
    WorkingDay,
} from "./styles";
import { CameraIcon, ClockIcon, LocationIcon, UserIcon } from "@common/icons";
import { Map, Placemark, YMaps, ZoomControl } from "@pbe/react-yandex-maps";
import { useMemo, useRef } from "react";
import { DEFAULT_ZOOM } from "@modules/masters/domain/constants";
import { useCoords } from "@common/hooks";
import { getIconForStatus } from "@modules/providers/features/ProvidersMap/ProvidersMap";

const getDetailsTitle = (activityType: ActivityType) => {
    switch (activityType) {
        case ActivityType.auto_service:
            return "Профиль автосервиса";
        case ActivityType.auto_shop:
            return "Профиль автомагазина";
        case ActivityType.auto_wash:
            return "Профиль автомойки";
        default:
            return "Профиль мастера";
    }
};

export const MasterDetailsScreen = ({providerId, providerType, isModal}: {providerId?: string; providerType?: ActivityType; isModal?: boolean} = {}) => {
    const [searchParams] = useSearchParams();
    const id = providerId || searchParams.get("id");
    const rawType = providerType || searchParams.get("type");
    const activityType = Object.values(ActivityType).includes(
        rawType as ActivityType
    )
        ? (rawType as ActivityType)
        : ActivityType.master;
    const mapRef = useRef<any>(null);
    const { userCoords } = useCoords();
    const {
        data: provider,
        isLoading,
        error,
    } = useQuery<Master>({
        queryKey: ["provider", activityType, id, userCoords],
        queryFn: () => {
            return fetchProviderByTypeAndId(
                activityType,
                id!,
                userCoords?.[0],
                userCoords?.[1]
            ) as Promise<Master>;
        },
        enabled: !!id,
        retry: false,
    });
    const mapState = useMemo(
        () => ({
            center: provider
                ? [provider.coordinates.x, provider.coordinates.y]
                : [0, 0],
            zoom: DEFAULT_ZOOM,
        }),
        [provider]
    );
    const title = getDetailsTitle(activityType);

    if (isLoading) {
        return isModal ? (
            <Container style={{ padding: 24, textAlign: 'center' }}>
                <div>Загрузка...</div>
            </Container>
        ) : (
            <AuthLayout title={title}>
                <div>Загрузка...</div>
            </AuthLayout>
        );
    }

    if (error || !provider) {
        return isModal ? (
            <Container style={{ padding: 24, textAlign: 'center' }}>
                <div>Ошибка загрузки профиля</div>
            </Container>
        ) : (
            <AuthLayout title={title}>
                <div>Ошибка загрузки профиля</div>
            </AuthLayout>
        );
    }

    const icon = getIconForStatus(provider.activityType, provider.currentStatus);

    const showAutoServiceDetails =
        provider.activityType === ActivityType.auto_service &&
        (provider.hasParking !== undefined ||
            provider.liftCount !== undefined ||
            provider.warranty !== undefined ||
            provider.hotline ||
            (provider.brandSupport?.length ?? 0) > 0);

    const content = (
            <Container>
                <MasterAccountHeader master={provider} />
                {provider.workFrom && provider.workTo && (
                    <BoxWrapper>
                        <Card>
                            <StyledCardHeader>
                                <ClockIcon />
                                График работы
                            </StyledCardHeader>
                            <StyledCardContent>
                                {`С ${provider.workFrom} - До ${provider.workTo}`}
                                <SpecializationSection>
                                    <SpecializationTags>
                                        {[
                                            "пн",
                                            "вт",
                                            "ср",
                                            "чт",
                                            "пт",
                                            "сб",
                                            "вс",
                                        ].map((day, index) => (
                                            <WorkingDay
                                                key={day}
                                                style={{
                                                    backgroundColor: provider
                                                        .workingDays?.[index]
                                                        ? "#ecfdf5"
                                                        : "#f1f5f9",
                                                    color: provider.workingDays?.[
                                                        index
                                                    ]
                                                        ? "#10b981"
                                                        : "#9ca3af",
                                                }}
                                            >
                                                {day}
                                            </WorkingDay>
                                        ))}
                                    </SpecializationTags>
                                </SpecializationSection>
                            </StyledCardContent>
                        </Card>
                    </BoxWrapper>
                )}
                <BoxWrapper>
                    <Card>
                        <StyledCardHeader>
                            <LocationIcon />
                            Местоположение
                        </StyledCardHeader>
                        <StyledCardContent>
                            <MapWrapper>
                                {provider?.address}
                                <YMaps
                                    query={{
                                        apikey: import.meta.env
                                            .VITE_YMAPS_API_KEY,
                                    }}
                                >
                                    <Map
                                        state={mapState}
                                        width="100%"
                                        height="30vh"
                                        instanceRef={(ref) =>
                                            (mapRef.current = ref)
                                        }
                                    >
                                        <ZoomControl
                                            options={{
                                                position: {
                                                    right: 16,
                                                    top: 16,
                                                },
                                            }}
                                        />
                                        {userCoords && (
                                            <Placemark
                                                key="__user__"
                                                geometry={userCoords}
                                                options={{
                                                    preset: "islands#blueCircleDotIcon",
                                                }}
                                                properties={{
                                                    hintContent: "Вы здесь",
                                                }}
                                            />
                                        )}
                                        <Placemark
                                            height={500}
                                            geometry={[
                                                provider?.coordinates.x,
                                                provider?.coordinates.y,
                                            ]}
                                            options={{
                                                iconLayout: "default#image",
                                                iconImageHref: icon.href,
                                                iconImageSize: icon.size,
                                                iconImageOffset: icon.offset,
                                            }}
                                            modules={[
                                                "geoObject.addon.balloon",
                                                "geoObject.addon.hint",
                                            ]}
                                            properties={{
                                                iconCaption: provider?.address,
                                            }}
                                        />
                                    </Map>
                                </YMaps>
                            </MapWrapper>
                        </StyledCardContent>
                    </Card>
                </BoxWrapper>
                {showAutoServiceDetails && (
                    <BoxWrapper>
                        <Card>
                            <StyledCardHeader>
                                <UserIcon />
                                Детали автосервиса
                            </StyledCardHeader>
                            <StyledCardContent>
                                <SpecializationSection>
                                    <SpecializationTags>
                                        {provider.hasParking !== undefined && (
                                            <WorkingDay
                                                style={{
                                                    backgroundColor: "#f1f5f9",
                                                    color: "#374151",
                                                }}
                                            >
                                                Парковка: {provider.hasParking ? "Да" : "Нет"}
                                            </WorkingDay>
                                        )}
                                        {provider.liftCount !== undefined && (
                                            <WorkingDay
                                                style={{
                                                    backgroundColor: "#f1f5f9",
                                                    color: "#374151",
                                                }}
                                            >
                                                Постов: {provider.liftCount}
                                            </WorkingDay>
                                        )}
                                        {provider.warranty !== undefined && (
                                            <WorkingDay
                                                style={{
                                                    backgroundColor: "#f1f5f9",
                                                    color: "#374151",
                                                }}
                                            >
                                                Гарантия: {provider.warranty ? "Да" : "Нет"}
                                            </WorkingDay>
                                        )}
                                    </SpecializationTags>
                                </SpecializationSection>
                                {provider.hotline && (
                                    <div>Горячая линия: {provider.hotline}</div>
                                )}
                                {(provider.brandSupport?.length ?? 0) > 0 && (
                                    <SpecializationSection>
                                        <SpecializationTags>
                                            {provider.brandSupport?.map((brand) => (
                                                <WorkingDay
                                                    key={brand}
                                                    style={{
                                                        backgroundColor: "#f1f5f9",
                                                        color: "#374151",
                                                    }}
                                                >
                                                    {brand}
                                                </WorkingDay>
                                            ))}
                                        </SpecializationTags>
                                    </SpecializationSection>
                                )}
                            </StyledCardContent>
                        </Card>
                    </BoxWrapper>
                )}
                <BoxWrapper>
                    <Card>
                        <StyledCardHeader>
                            <CameraIcon />
                            Фото работ
                        </StyledCardHeader>
                        <StyledCardContent>
                            <center>
                                <span>Скоро...</span>
                            </center>
                        </StyledCardContent>
                    </Card>
                </BoxWrapper>
                <BoxWrapper>
                    <Card>
                        <StyledCardHeader>
                            <UserIcon />
                            Отзывы
                        </StyledCardHeader>
                        <StyledCardContent>
                            <center>
                                <span>Скоро...</span>
                            </center>
                        </StyledCardContent>
                    </Card>
                </BoxWrapper>
            </Container>
    );

    if (isModal) {
        return content;
    }
    return (
        <AuthLayout title={title}>
            {content}
        </AuthLayout>
    );
};
