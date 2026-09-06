const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
`import { useMediaQuery, useTheme, Dialog, DialogContent, IconButton } from "@mui/material";`,
`import { useMediaQuery, useTheme } from "@mui/material";
import { CustomModal } from "@common/components/CustomModal";`
);

// We need to also remove the CloseIcon from MUI because we're using CrossIcon inside CustomModal
code = code.replace(`import CloseIcon from "@mui/icons-material/Close";\n`, "");

const dialogRegex = /<Dialog[\s\S]*?<\/Dialog>/;
const newDialog = `            <CustomModal
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
            </CustomModal>`;

code = code.replace(dialogRegex, newDialog);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
