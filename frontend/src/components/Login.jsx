import React, { useState } from "react";
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState("anurag.cmho@smarthealth.gov.in");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to log in");
            }

            // Save token and user details to localStorage
            localStorage.setItem("sh_token", data.token);
            localStorage.setItem("sh_user", JSON.stringify(data.user));

            // Execute success callback
            onLoginSuccess(data.token, data.user);

        } catch (err) {
            console.error("Login request error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCitizenAccess = () => {
        const dummyUser = {
            id: 0,
            name: "Citizen Guest",
            email: "citizen.guest@smarthealth.gov.in",
            role: "Citizen"
        };
        const dummyToken = "citizen_guest_token";

        localStorage.setItem("sh_token", dummyToken);
        localStorage.setItem("sh_user", JSON.stringify(dummyUser));

        onLoginSuccess(dummyToken, dummyUser);
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <h2>Smart Health Login</h2>
                <p className="login-subtitle">Access your health resource panel</p>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    <div className="login-divider" style={{ textAlign: "center", margin: "1rem 0", color: "#64748b", fontSize: "0.85rem" }}>
                        <span>─ or ─</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary btn-block"
                        onClick={handleCitizenAccess}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
                    >
                        Access as Citizen (Guest)
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
