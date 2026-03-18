const config = {
    // Priority: 1. Env Var, 2. Localhost fallback
    API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000",
};

// Log only if not in production to keep console clean
if (import.meta.env.MODE !== 'production') {
    console.log("🚀 App Config:", config);
}

console.log("🚀 App Config Loaded:", config);


export default config;
