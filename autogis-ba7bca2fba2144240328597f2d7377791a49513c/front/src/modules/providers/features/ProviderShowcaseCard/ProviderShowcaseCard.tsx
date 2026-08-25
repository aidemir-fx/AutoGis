import {
    CalendarIcon,
    EyeIcon,
    MapPinIcon,
    PhoneIcon,
    StarIcon,
    WrenchIcon,
} from "@common/icons";
import { formatDistanceFromUser } from "@common/lib/formatDistance";
import { MasterStatus } from "@modules/masters";
import { ActivityType, Provider } from "../../types";
import {
    ActionLink,
    Actions,
    Avatar,
    AvatarImage,
    Block,
    BlockTitle,
    Body,
    CardRoot,
    Cover,
    CoverBadge,
    CoverImage,
    CoverMapButton,
    CoverOverlays,
    CoverRow,
    CoverScrim,
    CoverStatusPill,
    Day,
    Days,
    Distance,
    Dot,
    Identity,
    LiveDot,
    MapButton,
    MasterHead,
    MetaRow,
    OnlinePill,
    OrgAddress,
    OrgIdentity,
    OrgMeta,
    ProviderName,
    RatingPill,
    Reviews,
    StatusPill,
    StatusRow,
    Tag,
    Tags,
} from "./styles";

const WEEK_DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEK_DAYS_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type VisualStatus = "on" | "busy" | "off";

type ProviderShowcaseCardProps = {
    provider: Provider;
    className?: string;
    onShowOnMap?: (provider: Provider) => void;
};

function getProviderType(provider: Provider): ActivityType {
    return provider.activityType || ActivityType.master;
}

function isMasterProvider(provider: Provider): boolean {
    return getProviderType(provider) === ActivityType.master;
}

function shouldShowBookingAction(provider: Provider): boolean {
    const type = getProviderType(provider);

    return (
        Boolean(provider.onlineBookingEnabled) &&
        (type === ActivityType.master ||
            type === ActivityType.auto_service ||
            type === ActivityType.auto_wash)
    );
}

function getDisplayName(provider: Provider): string {
    return (
        provider.fullName ||
        provider.businessName ||
        provider.name ||
        (isMasterProvider(provider) ? "Мастер" : "Организация")
    );
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function getAvatarUrl(provider: Provider): string | undefined {
    return provider.avatar || provider.avatarUrl || undefined;
}

function getCoverUrl(provider: Provider): string | undefined {
    return provider.coverImageUrl || provider.coverImage || undefined;
}

function getVisualStatus(provider: Provider): VisualStatus {
    const status = provider.currentStatus || provider.status;

    if (status === MasterStatus.AVAILABLE) {
        return "on";
    }

    return "off";
}

function getStatusLabel(provider: Provider): string {
    const status = provider.currentStatus || provider.status;

    if (status === MasterStatus.AVAILABLE) {
        return isMasterProvider(provider) ? "На работе" : "Открыто";
    }

    return isMasterProvider(provider) ? "Не работает" : "Закрыто";
}

function formatClock(time?: string): string | undefined {
    if (!time) {
        return undefined;
    }

    return time.slice(0, 5);
}

function getStatusSummary(provider: Provider): string {
    const status = provider.currentStatus || provider.status;
    const label = getStatusLabel(provider);
    const workTo = formatClock(provider.workTo);

    if (status === MasterStatus.AVAILABLE && workTo) {
        return `${label} до ${workTo}`;
    }

    return label;
}

function formatWorkingDaysSummary(workingDays?: boolean[]): string {
    const activeIndexes =
        workingDays
            ?.map((isActive, index) => (isActive ? index : -1))
            .filter((index) => index >= 0) ?? [];

    if (activeIndexes.length === 0) {
        return "График уточняется";
    }

    if (activeIndexes.length === WEEK_DAYS_LABELS.length) {
        return "Ежедневно";
    }

    const ranges: string[] = [];
    let rangeStart = activeIndexes[0];
    let previous = activeIndexes[0];

    for (const index of activeIndexes.slice(1)) {
        if (index === previous + 1) {
            previous = index;
            continue;
        }

        ranges.push(
            rangeStart === previous
                ? WEEK_DAYS_LABELS[rangeStart]
                : `${WEEK_DAYS_LABELS[rangeStart]}-${WEEK_DAYS_LABELS[previous]}`
        );
        rangeStart = index;
        previous = index;
    }

    ranges.push(
        rangeStart === previous
            ? WEEK_DAYS_LABELS[rangeStart]
            : `${WEEK_DAYS_LABELS[rangeStart]}-${WEEK_DAYS_LABELS[previous]}`
    );

    return ranges.join(", ");
}

function buildTags(provider: Provider): string[] {
    const isMaster = isMasterProvider(provider);
    const tags = isMaster
        ? [
              ...(provider.professions || []).slice(0, 1),
              ...(provider.services || []).slice(0, 2),
              ...(provider.autoMarks || []).slice(0, 1),
          ]
        : [
              ...(provider.professions || []).slice(0, 3),
              ...(provider.services || []).slice(0, 2),
          ];

    const normalized = Array.from(new Set(tags.filter(Boolean)));

    if (normalized.length <= 4) {
        return normalized;
    }

    return [...normalized.slice(0, 3), `+${normalized.length - 3}`];
}

function getDetailsHref(provider: Provider): string {
    return `/provider?id=${provider.id}&type=${getProviderType(provider)}`;
}

function getPhoneHref(provider: Provider): string {
    return provider.workingPhone || provider.phone
        ? `tel:${provider.workingPhone || provider.phone}`
        : "#";
}

function RatingBadge({ provider }: { provider: Provider }) {
    const rating = provider.rating || 0;
    const reviewsCount = provider.reviewsCount || 0;

    return (
        <RatingPill>
            <StarIcon />
            {rating > 0 ? rating.toFixed(1) : "0.0"}
            <Reviews>({reviewsCount})</Reviews>
        </RatingPill>
    );
}

function WorkingDays({ provider }: { provider: Provider }) {
    return (
        <Days>
            {WEEK_DAYS.map((day, index) => (
                <Day key={day} $isActive={Boolean(provider.workingDays?.[index])}>
                    {day}
                </Day>
            ))}
        </Days>
    );
}

function CardActions({ provider }: { provider: Provider }) {
    if (shouldShowBookingAction(provider)) {
        return (
            <Actions $layout="booking">
                <ActionLink href={getDetailsHref(provider)} $variant="booking">
                    <CalendarIcon />
                    Записаться
                </ActionLink>
                <ActionLink
                    href={getPhoneHref(provider)}
                    $variant="phoneIcon"
                    aria-label="Позвонить"
                    title="Позвонить"
                >
                    <PhoneIcon />
                </ActionLink>
            </Actions>
        );
    }

    return (
        <Actions>
            <ActionLink href={getPhoneHref(provider)} $variant="primary">
                <PhoneIcon />
                Позвонить
            </ActionLink>
            <ActionLink href={getDetailsHref(provider)} $variant="outline">
                <EyeIcon />
                Подробнее
            </ActionLink>
        </Actions>
    );
}

function MasterScheduleSummary({ provider }: { provider: Provider }) {
    return (
        <StatusRow>
            <StatusPill $status={getVisualStatus(provider)}>
                {getStatusSummary(provider)}
            </StatusPill>
            <Tag>{formatWorkingDaysSummary(provider.workingDays)}</Tag>
        </StatusRow>
    );
}

function TagsBlock({
    provider,
    compact = false,
}: {
    provider: Provider;
    compact?: boolean;
}) {
    const tags = buildTags(provider);
    const title = isMasterProvider(provider) ? "Специализация" : "Услуги";

    if (compact) {
        return (
            <Tags>
                {tags.length > 0 ? (
                    tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                ) : (
                    <Tag>Заполняется</Tag>
                )}
            </Tags>
        );
    }

    return (
        <Block>
            <BlockTitle>
                <WrenchIcon />
                {title}
            </BlockTitle>
            <Tags>
                {tags.length > 0 ? (
                    tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                ) : (
                    <Tag>Заполняется</Tag>
                )}
            </Tags>
        </Block>
    );
}

function MasterCard({
    provider,
    onShowOnMap,
}: ProviderShowcaseCardProps) {
    const name = getDisplayName(provider);
    const avatarUrl = getAvatarUrl(provider);
    const status = getVisualStatus(provider);

    return (
        <>
            <MasterHead>
                <Avatar>
                    {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={name} />
                    ) : (
                        getInitials(name)
                    )}
                    <LiveDot $status={status} />
                </Avatar>
                <Identity>
                    <ProviderName>{name}</ProviderName>
                    <MetaRow>
                        <RatingBadge provider={provider} />
                        <Dot />
                        <Distance>
                            {formatDistanceFromUser(provider.distance)}
                        </Distance>
                    </MetaRow>
                </Identity>
                <MapButton
                    type="button"
                    onClick={() => onShowOnMap?.(provider)}
                    aria-label={`Показать ${name} на карте`}
                >
                    <MapPinIcon />
                    На карте
                </MapButton>
            </MasterHead>
            <Body>
                <MasterScheduleSummary provider={provider} />
                <TagsBlock provider={provider} compact />
                <CardActions provider={provider} />
            </Body>
        </>
    );
}

function OrganizationCard({
    provider,
    onShowOnMap,
}: ProviderShowcaseCardProps) {
    const name = getDisplayName(provider);
    const type = getProviderType(provider);
    const coverUrl = getCoverUrl(provider);
    const status = getVisualStatus(provider);

    return (
        <>
            <Cover $activityType={type}>
                {coverUrl && <CoverImage src={coverUrl} alt={name} />}
                <CoverScrim />
                <CoverOverlays>
                    <CoverRow>
                        {provider.onlineBookingEnabled && (
                            <OnlinePill $cover>
                                <CalendarIcon />
                                Запись онлайн
                            </OnlinePill>
                        )}
                        <CoverBadge>
                            <StarIcon />
                            {provider.rating ? provider.rating.toFixed(1) : "0.0"}
                            <Reviews>({provider.reviewsCount || 0})</Reviews>
                        </CoverBadge>
                    </CoverRow>
                    <CoverRow>
                        <CoverStatusPill $status={status}>
                            {getStatusLabel(provider)}
                        </CoverStatusPill>
                        <CoverMapButton
                            type="button"
                            onClick={() => onShowOnMap?.(provider)}
                            aria-label={`Показать ${name} на карте`}
                        >
                            <MapPinIcon />
                            На карте
                        </CoverMapButton>
                    </CoverRow>
                </CoverOverlays>
            </Cover>
            <OrgIdentity>
                <ProviderName>{name}</ProviderName>
                <OrgMeta>
                    <Distance>
                        <MapPinIcon />
                        {formatDistanceFromUser(provider.distance)}
                    </Distance>
                    <Dot />
                    <OrgAddress>{provider.address || "Адрес уточняется"}</OrgAddress>
                </OrgMeta>
            </OrgIdentity>
            <Body>
                <TagsBlock provider={provider} />
                <Block>
                    <BlockTitle>Рабочие дни</BlockTitle>
                    <WorkingDays provider={provider} />
                </Block>
                <CardActions provider={provider} />
            </Body>
        </>
    );
}

export const ProviderShowcaseCard = ({
    provider,
    className,
    onShowOnMap,
}: ProviderShowcaseCardProps) => {
    const isMaster = isMasterProvider(provider);

    return (
        <CardRoot
            className={className}
            $variant={isMaster ? "master" : "organization"}
        >
            {isMaster ? (
                <MasterCard provider={provider} onShowOnMap={onShowOnMap} />
            ) : (
                <OrganizationCard
                    provider={provider}
                    onShowOnMap={onShowOnMap}
                />
            )}
        </CardRoot>
    );
};
