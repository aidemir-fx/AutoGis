import { useState } from "react";
import { Button, Card } from "@common/components";
import {
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    StarIcon,
    WrenchIcon,
} from "@common/icons";
import { formatDistanceFromUser } from "@common/lib/formatDistance";
import { Master } from "@modules/masters/types";
import { MasterInfo, MasterName } from "./styles";
import {
    AvatarImage,
    AvatarFallback,
    MasterDetails,
    RatingContainer,
    RatingText,
    ReviewCount,
    DistanceContainer,
    DistanceText,
    StatusBadge,
    StatusDot,
    ContentContainer,
    SpecializationSection,
    SpecializationHeader,
    SpecializationLabel,
    SpecializationTags,
    SpecializationTag,
    Avatar,
    CoverHero,
    CoverHeroImage,
    DetailsHeader,
    DescriptionWrapper,
} from "./styles";
import { toast } from "react-toastify";
import { MakeAppointmentButton } from "./styles";
import { CreateOrderModal } from "../CreateOrderModal";
import { useAuth } from "@common/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { MasterStatus } from "@modules/masters/types";

const statusConfig: Record<
    MasterStatus,
    {
        label: string;
        color: string;
        textColor: string;
        bgColor: string;
    }
> = {
    [MasterStatus.AVAILABLE]: {
        label: "Открыто",
        color: "#10b981",
        textColor: "#047857",
        bgColor: "#ecfdf5",
    },
    [MasterStatus.SCHEDULE]: {
        label: "Закрыто",
        color: "#9ca3af",
        textColor: "#374151",
        bgColor: "#f1f5f9",
    },
    [MasterStatus.UNAVAILABLE]: {
        label: "Закрыто",
        color: "#9ca3af",
        textColor: "#374151",
        bgColor: "#f1f5f9",
    },
};

// Components
export const MasterAccountHeader = ({ master }: { master: Master }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const statusInfo = statusConfig[master.currentStatus || master.status];
    const coverUrl = master.coverImageUrl || master.coverImage;
    const showCover = Boolean(coverUrl && master.activityType && master.activityType !== "master");

    const specs = [
        ...master.professions,
        ...master.services,
        ...master.autoMarks,
    ];

    const handleMakeAppointment = () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <>
            <Card>
                {showCover && (
                    <CoverHero>
                        <CoverHeroImage src={coverUrl} alt={master.fullName} />
                    </CoverHero>
                )}
                <Card.Header>
                    <MasterInfo>
                        <Avatar>
                            {master.avatar && !avatarFailed ? (
                                <AvatarImage
                                    src={master.avatar}
                                    alt={master.fullName}
                                    onError={() => setAvatarFailed(true)}
                                />
                            ) : (
                                <AvatarFallback>
                                    {master.fullName
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <MasterDetails>
                            <DetailsHeader>
                                <MasterName>{master.fullName}</MasterName>
                                <RatingContainer>
                                    <StarIcon />
                                    <RatingText>0</RatingText>
                                    <ReviewCount>(0)</ReviewCount>
                                </RatingContainer>
                            </DetailsHeader>
                            <DistanceContainer>
                                <MapPinIcon color="#3b82f6" />

                                <DistanceText>
                                    {formatDistanceFromUser(master.distance)}
                                </DistanceText>
                            </DistanceContainer>
                            <StatusBadge
                                bgColor={statusInfo.bgColor}
                                textColor={statusInfo.textColor}
                            >
                                <StatusDot color={statusInfo.color} />
                                {statusInfo.label}
                            </StatusBadge>
                        </MasterDetails>
                    </MasterInfo>
                </Card.Header>

                <Card.Content>
                    <ContentContainer>
                        <DescriptionWrapper>
                            {master.description}
                        </DescriptionWrapper>
                        <SpecializationSection>
                            <SpecializationHeader>
                                <WrenchIcon color="#64748b" />
                                <SpecializationLabel>
                                    Специализация:
                                </SpecializationLabel>
                            </SpecializationHeader>
                            <SpecializationTags>
                                {specs.length > 0 ? (
                                    specs.map((spec, index) => (
                                        <>
                                            <SpecializationTag key={index}>
                                                {spec}
                                            </SpecializationTag>
                                        </>
                                    ))
                                ) : (
                                    <SpecializationTag>
                                        Нет специализаций
                                    </SpecializationTag>
                                )}
                            </SpecializationTags>
                        </SpecializationSection>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                            }}
                        >
                            <Button
                                icon={<PhoneIcon />}
                                isFullWidth
                                onClick={() => {
                                    if (master.workingPhone) {
                                        window.location.href = `tel:${master.workingPhone}`;
                                    }
                                }}
                            >
                                Позвонить
                            </Button>

                            <MakeAppointmentButton
                                icon={<CalendarIcon />}
                                variant="outlined"
                                isFullWidth
                                onClick={handleMakeAppointment}
                            >
                                Оставить заявку
                            </MakeAppointmentButton>
                        </div>
                    </ContentContainer>
                </Card.Content>
            </Card>

            <CreateOrderModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                provider={master}
            />
        </>
    );
};
