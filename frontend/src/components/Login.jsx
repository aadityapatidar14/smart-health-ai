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

    const handleQuickFill = (roleEmail) => {
        setEmail(roleEmail);
        setPassword("password123");
    };

    return (
        <div className="login-container" style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center", alignItems: "flex-start", padding: "3rem 1rem", maxWidth: "950px", margin: "0 auto", minHeight: "85vh" }}>
            {/* Login Input Card */}
            <div className="login-card card" style={{ flex: "1 1 380px", maxWidth: "420px" }}>
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

            {/* Quick Demo Login Credentials Card for Judges */}
            <div className="card" style={{ flex: "1 1 380px", maxWidth: "420px", border: "1px solid #cbd5e1" }}>
                <h2 style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: "0.5rem", fontWeight: "700", textAlign: "left" }}>Evaluator Quick-Access Panel</h2>
                <p style={{ color: "#64748b", fontSize: "0.825rem", marginBottom: "1.25rem", textAlign: "left" }}>
                    Select a testing profile below to automatically populate credentials, then click **Log In** to view features:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div 
                        onClick={() => handleQuickFill("anurag.cmho@smarthealth.gov.in")}
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", backgroundColor: email === "anurag.cmho@smarthealth.gov.in" ? "#f0f9ff" : "#ffffff", borderColor: email === "anurag.cmho@smarthealth.gov.in" ? "#0284c7" : "#cbd5e1", transition: "all 0.2s", textAlign: "left" }}
                    >
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0369a1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>District Admin (CMHO)</span>
                            <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", padding: "1px 6px", borderRadius: "4px" }}>District Role</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "4px" }}>Email: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>anurag.cmho@smarthealth.gov.in</code></div>
                        <div style={{ fontSize: "0.8rem", color: "#475569" }}>Password: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>password123</code></div>
                    </div>

                    <div 
                    onClick={() => handleQuickFill("manager.depalpur@smarthealth.gov.in")}
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", backgroundColor: email === "manager.depalpur@smarthealth.gov.in" ? "#f0f9ff" : "#ffffff", borderColor: email === "manager.depalpur@smarthealth.gov.in" ? "#0284c7" : "#cbd5e1", transition: "all 0.2s", textAlign: "left" }}
                    >
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0369a1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Center Manager (Depalpur CHC)</span>
                            <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", padding: "1px 6px", borderRadius: "4px" }}>Manager Role</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "4px" }}>Email: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>manager.depalpur@smarthealth.gov.in</code></div>
                        <div style={{ fontSize: "0.8rem", color: "#475569" }}>Password: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>password123</code></div>
                    </div>

                    <div 
                        onClick={() => handleQuickFill("doc.viveksaxena1@smarthealth.gov.in")}
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", backgroundColor: email === "doc.viveksaxena1@smarthealth.gov.in" ? "#f0f9ff" : "#ffffff", borderColor: email === "doc.viveksaxena1@smarthealth.gov.in" ? "#0284c7" : "#cbd5e1", transition: "all 0.2s", textAlign: "left" }}
                    >
                        <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0369a1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Doctor Profile (Dr. Vivek Saxena)</span>
                            <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", padding: "1px 6px", borderRadius: "4px" }}>Doctor Role</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "4px" }}>Email: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>doc.viveksaxena1@smarthealth.gov.in</code></div>
                        <div style={{ fontSize: "0.8rem", color: "#475569" }}>Password: <code style={{ backgroundColor: "#f1f5f9", padding: "1px 4px", borderRadius: "2px" }}>password123</code></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
