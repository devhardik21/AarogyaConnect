const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // If we are on an IP or named host (not localhost)
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // If on Render or similar cloud (usually no port needed in URL)
            if (hostname.includes('onrender.com')) {
                // Return same hostname but backend might be a different service 
                // We strongly prefer Env Vars here, but as a fallback:
                return `${protocol}//${hostname}`;
            }
            // For local WiFi testing (e.g. 192.168.1.5)
            return `http://${hostname}:5000`;
        }
    }
    return "http://localhost:5000";
};

const config = {
    API_BASE_URL: import.meta.env.VITE_API_URL || getBaseURL(),
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || getBaseURL(),
};

console.log("🚀 App Config Loaded:", config);


export default config;
