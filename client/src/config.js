const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If we are on an IP or named host (not localhost), use it for API/Socket
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `http://${hostname}:5000`;
        }
    }
    return "http://localhost:5000";
};

const config = {
    API_BASE_URL: import.meta.env.VITE_API_URL || getBaseURL(),
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || getBaseURL(),
};

export default config;
