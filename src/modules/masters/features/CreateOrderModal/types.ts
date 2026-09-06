import { Provider } from "@modules/providers";

export interface CreateOrderModalProps {
    open: boolean;
    onClose: () => void;
    provider: Provider;
}
