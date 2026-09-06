import React from "react";
import { useUserProfile } from "@common/hooks";
import { UserRole } from "@common/types/user";
import { CustomerSettings } from "../CustomerSettings/CustomerSettings";
import { MasterSettings } from "../MasterSettings/MasterSettings";
import { AutoWashSettings } from "../AutoWashSettings/AutoWashSettings";
import { AutoShopSettings } from "../AutoShopSettings/AutoShopSettings";
import { AutoServiceSettings } from "../AutoServiceSettings/AutoServiceSettings";

export function Settings() {
    const { profile } = useUserProfile();

    if (!profile) return null;

    switch (profile.role) {
        case UserRole.CUSTOMER:
            return <CustomerSettings />;
        case UserRole.MASTER:
            return <MasterSettings />;
        case UserRole.AUTO_WASH:
            return <AutoWashSettings />;
        case UserRole.AUTO_SHOP:
            return <AutoShopSettings />;
        case UserRole.AUTO_SERVICE:
            return <AutoServiceSettings />;
        default:
            return <CustomerSettings />;
    }
}
