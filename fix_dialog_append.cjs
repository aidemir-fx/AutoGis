const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
`            <RadiusPickerModal
                open={isRadiusPickerOpen}
                onClose={() => setIsRadiusPickerOpen(false)}
                currentRadius={radius}
                onSelectRadius={handleSelectRadius}
            />
            <GeolocationPrompt />
        </PageRoot>
    );
};`,
`            <RadiusPickerModal
                open={isRadiusPickerOpen}
                onClose={() => setIsRadiusPickerOpen(false)}
                currentRadius={radius}
                onSelectRadius={handleSelectRadius}
            />
            <GeolocationPrompt />
            <Dialog
                open={!!selectedProviderForDetails}
                onClose={() => setSelectedProviderForDetails(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                        maxHeight: '90vh',
                        margin: '16px',
                        width: '100%',
                        backgroundColor: '#f8fafc',
                    }
                }}
            >
                {selectedProviderForDetails && (
                    <>
                        <IconButton
                            aria-label="close"
                            onClick={() => setSelectedProviderForDetails(null)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                zIndex: 10,
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                '&:hover': {
                                    backgroundColor: '#f1f5f9',
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <DialogContent sx={{ p: 0 }}>
                            <MasterDetailsScreen
                                providerId={selectedProviderForDetails.id}
                                providerType={selectedProviderForDetails.activityType}
                                isModal={true}
                            />
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </PageRoot>
    );
};`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
