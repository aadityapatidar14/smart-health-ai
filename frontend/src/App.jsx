import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Read auth state from localStorage on load
        const savedToken = localStorage.getItem("sh_token");
        const savedUser = localStorage.getItem("sh_user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setInitialized(true);
    }, []);

    const handleLoginSuccess = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
    };

    const handleLogout = () => {
        localStorage.removeItem("sh_token");
        localStorage.removeItem("sh_user");
        setToken(null);
        setUser(null);
    };

    // Wait until we've read from localStorage to avoid flashing the login screen
    if (!initialized) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p>Loading application state...</p>
            </div>
        );
    }

    return (
        <div className="app-root">
            {token && user ? (
                <Dashboard user={user} token={token} onLogout={handleLogout} />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
