import { useNavigate, useLocation } from "react-router-dom";
import {
    SidebarHeader,
    Logo,
    MenuSection,
    MenuItem,
    MenuIcon,
    MenuText,
    Root,
    LogoutWrapper,
} from "./styles";
import {
    ChatIcon,
    GearFillIcon,
    LogoIcon,
    LogoutIcon,
    PaperIcon,
    WrenchIcon,
} from "@common/icons";
import { hasCapability } from "@common/lib/userAccess";
import { useAuth, useUserProfile } from "@common/hooks";
import { Button } from "@common/components";

type SidebarProps = {
    onMenuItemClick?: () => void;
};

export const Sidebar = (props: SidebarProps) => {
    const { onMenuItemClick } = props;
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useUserProfile();
    const { logout } = useAuth();
    const hasProfessionalChatAccess = hasCapability(
        profile,
        "professionalChat",
    );
    const hasApplicationsAccess = hasCapability(profile, "applications");
    const hasCalendarAccess = hasCapability(profile, "calendar");

    const handleLogoClick = () => {
        navigate("/");
    };

    const handleMenuItemClick = (path: string) => {
        navigate(path);
        onMenuItemClick?.();
    };

    const menuItems: Array<{
        id: string;
        label: string;
        icon: React.ReactElement;
        path: string;
    }> = [
        {
            id: "personal-chat",
            label: "Личный чат",
            icon: <ChatIcon />,
            path: "/cabinet/chats?tab=ordinary",
        },
        {
            id: "settings",
            label: "Настройки",
            icon: <GearFillIcon />,
            path: "/cabinet",
        },
    ];

    if (hasProfessionalChatAccess) {
        menuItems.push({
            id: "professional-chat",
            label: "Профессиональный чат",
            icon: <WrenchIcon />,
            path: "/cabinet/chats?tab=professional",
        });
    }

    if (hasApplicationsAccess) {
        menuItems.push({
            id: "applications",
            label: "Заявки",
            icon: <PaperIcon />,
            path: "/cabinet/applications",
        });
    }
    if (hasCalendarAccess) {
        menuItems.push({
            id: "calendar",
            label: "Календарь",
            icon: <PaperIcon />,
            path: "/cabinet/calendar",
        });
    }
    return (
        <Root>
            <SidebarHeader onClick={handleLogoClick}>
                <Logo>
                    <img src={LogoIcon} alt="Логотип" />
                </Logo>
            </SidebarHeader>

            <MenuSection>
                {menuItems.map((item) => (
                    <MenuItem
                        key={item.id}
                        active={`${location.pathname}${location.search}` === item.path}
                        onClick={() => handleMenuItemClick(item.path)}
                    >
                        <MenuIcon>{item.icon}</MenuIcon>
                        <MenuText>{item.label}</MenuText>
                    </MenuItem>
                ))}
            </MenuSection>
            <LogoutWrapper>
                <Button
                    isFullWidth
                    variant="outlined"
                    onClick={logout}
                    icon={<LogoutIcon />}
                >
                    Выйти
                </Button>
            </LogoutWrapper>
        </Root>
    );
};
