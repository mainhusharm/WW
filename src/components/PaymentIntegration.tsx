import { ENV_CONFIG } from '../api/config';

// ... existing code ...

const PaymentIntegration = () => {
    // ...
    useEffect(() => {
        const apiBase = ENV_CONFIG.apiBaseUrl;
        // ...
    }, []);

    // ...
}

export default PaymentIntegration;