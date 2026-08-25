import {
    User,
    UserAccountType,
    UserCapabilities,
    UserRole,
} from "@common/types/user";

export type UserCapabilityKey = keyof UserCapabilities;

export function deriveUserAccountType(role?: UserRole): UserAccountType {
    switch (role) {
        case UserRole.MASTER:
            return UserAccountType.PRIVATE_EXECUTOR;
        case UserRole.AUTO_WASH:
            return UserAccountType.AUTO_WASH;
        case UserRole.AUTO_SHOP:
            return UserAccountType.AUTO_SHOP;
        case UserRole.AUTO_SERVICE:
            return UserAccountType.AUTO_SERVICE;
        case UserRole.ADMIN:
            return UserAccountType.ADMIN;
        case UserRole.MODERATOR:
            return UserAccountType.MODERATOR;
        default:
            return UserAccountType.CUSTOMER;
    }
}

export function deriveUserCapabilities(input: {
    accountType?: UserAccountType;
    role?: UserRole;
    isProfessional?: boolean;
}): UserCapabilities {
    const accountType =
        input.accountType ?? deriveUserAccountType(input.role);
    const professionalCabinet = input.isProfessional === true;
    const crmMini =
        professionalCabinet &&
        accountType === UserAccountType.PRIVATE_EXECUTOR;
    const businessCrm = false;
    const providerWorkflowAccess = professionalCabinet;

    return {
        professionalCabinet,
        crmMini,
        businessCrm,
        professionalChat: providerWorkflowAccess,
        applications: providerWorkflowAccess,
        calendar: providerWorkflowAccess,
    };
}

export function normalizeUserProfile(profile: User): User {
    const accountType =
        profile.accountType ?? deriveUserAccountType(profile.role);
    const hasProfessionalActivity =
        Array.isArray(profile.activityTypes) &&
        profile.activityTypes.length > 0;
    const isProfessional = profile.isProfessional ?? hasProfessionalActivity;

    return {
        ...profile,
        accountType,
        contactNumber: profile.contactNumber ?? profile.phone,
        isProfessional,
        capabilities:
            profile.capabilities ??
            deriveUserCapabilities({
                accountType,
                role: profile.role,
                isProfessional,
            }),
    };
}

export function hasCapability(
    profile: User | null | undefined,
    capability: UserCapabilityKey,
): boolean {
    if (!profile) return false;
    const normalized = normalizeUserProfile(profile);
    return normalized.capabilities?.[capability] === true;
}
