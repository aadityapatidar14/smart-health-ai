import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Check, X, Search, RefreshCw, AlertTriangle } from "lucide-react";
import "./AIRecommendationsTab.css";

const AIRecommendationsTab = ({ token, user }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [forecasts, setForecasts] = useState([]);
    const [activeSubTab, setActiveSubTab] = useState("redistribution"); // "redistribution" or "forecasting"
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch("http://localhost:5000/recommendations", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch AI recommendations");
            }

            setRecommendations(data);
        } catch (err) {
            console.error("Fetch recommendations error:", err);
            setError(err.message);
        }
    };

    const fetchForecasts = async () => {
        try {
            const response = await fetch("http://localhost:5000/recommendations/forecasts", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch demand forecasts");
            }

            setForecasts(data);
        } catch (err) {
            console.error("Fetch forecasts error:", err);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        setError("");
        await Promise.all([fetchRecommendations(), fetchForecasts()]);
        setLoading(false);
    };

    useEffect(() => {
        loadAllData();
    }, [token]);

    const handleApprove = async (id) => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/recommendations/${id}/approve`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to approve recommendation");
            }

            alert("✅ Stock redistribution approved and executed! Inventory levels have been adjusted.");
            await loadAllData();
        } catch (err) {
            console.error("Approve recommendation error:", err);
            alert(`⚠️ Approval failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (actionLoading) return;
        if (!window.confirm("Are you sure you want to reject this redistribution suggestion?")) return;

        setActionLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/recommendations/${id}/reject`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reject recommendation");
            }

            await loadAllData();
        } catch (err) {
            console.error("Reject recommendation error:", err);
            alert(`⚠️ Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Filters
    const filteredRecommendations = recommendations.filter(rec => {
        const query = searchQuery.toLowerCase();
        return (
            rec.medicine_name.toLowerCase().includes(query) ||
            rec.medicine_generic.toLowerCase().includes(query) ||
            rec.source_centre_name.toLowerCase().includes(query) ||
            rec.destination_centre_name.toLowerCase().includes(query) ||
            rec.status.toLowerCase().includes(query)
        );
    });

    const filteredForecasts = forecasts.filter(f => {
        const query = searchQuery.toLowerCase();
        return (
            f.health_centre_name.toLowerCase().includes(query) ||
            f.medicine_name.toLowerCase().includes(query) ||
            f.medicine_generic.toLowerCase().includes(query)
        );
    });

    const getStatusClass = (status) => {
        if (status === "Pending") return "badge-pending";
        if (status === "Completed") return "badge-completed";
        if (status === "Rejected") return "badge-rejected";
        return "";
    };

    return (
        <div className="ai-tab-container">
            <div className="ai-header-wrapper">
                <div className="tab-header">
                    <h2>AI-Powered Logistics Engine</h2>
                    <button className="btn btn-secondary btn-refresh" onClick={loadAllData} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} />
                        Refresh Data
                    </button>
                </div>
                
                {/* Sub-tabs toggler */}
                <div className="ai-sub-tabs">
                    <button 
                        className={`sub-tab-btn ${activeSubTab === "redistribution" ? "active" : ""}`}
                        onClick={() => { setActiveSubTab("redistribution"); setSearchQuery(""); }}
                    >
                        <Sparkles size={16} style={{ marginRight: "6px" }} />
                        Stock Redistribution
                    </button>
                    <button 
                        className={`sub-tab-btn ${activeSubTab === "forecasting" ? "active" : ""}`}
                        onClick={() => { setActiveSubTab("forecasting"); setSearchQuery(""); }}
                    >
                        <TrendingUp size={16} style={{ marginRight: "6px" }} />
                        Demand Forecasting
                    </button>
                </div>
            </div>

            <div className="list-controls">
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder={
                            activeSubTab === "redistribution"
                                ? "Search by facility, medicine, or transfer status..."
                                : "Search by facility name or forecasted medicine..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Processing data logs through the AI engine...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading AI predictions: {error}</p>
                </div>
            ) : activeSubTab === "redistribution" ? (
                /* REDISTRIBUTION RECOMMENDATIONS GRID VIEW */
                filteredRecommendations.length === 0 ? (
                    <div className="empty-state card">
                        <p>No redistribution recommendations found.</p>
                    </div>
                ) : (
                    <div className="recommendations-grid">
                        {filteredRecommendations.map((rec) => (
                            <div key={rec.id} className={`recommendation-card card ${rec.status.toLowerCase()}`}>
                                <div className="card-header-status">
                                    <span className="rec-id">Recommendation ID: #{rec.id}</span>
                                    <span className={`status-badge ${getStatusClass(rec.status)}`}>
                                        {rec.status}
                                    </span>
                                </div>

                                <div className="transfer-details">
                                    <div className="transfer-node source">
                                        <label>SURPLUS SOURCE</label>
                                        <strong>{rec.source_centre_name}</strong>
                                    </div>
                                    <div className="transfer-arrow">⬇</div>
                                    <div className="transfer-node destination">
                                        <label>DEFICIT DESTINATION</label>
                                        <strong>{rec.destination_centre_name}</strong>
                                    </div>
                                </div>

                                <div className="medication-details">
                                    <label>RECOMMENDED DRUG</label>
                                    <h3>{rec.medicine_name}</h3>
                                    <p>{rec.medicine_generic}</p>
                                </div>

                                <div className="transfer-qty-box">
                                    <span className="qty-label">Quantity:</span>
                                    <span className="qty-value">{rec.recommended_quantity} units</span>
                                </div>

                                {rec.status === "Pending" && (
                                    <div className="rec-card-actions">
                                        {(user?.role === "DistrictAdmin" || 
                                          ((user?.role === "CenterManager" || user?.role === "Pharmacist") && 
                                           (Number(rec.source_centre_id) === Number(user.health_centre_id) || 
                                            Number(rec.destination_centre_id) === Number(user.health_centre_id)))) ? (
                                            <>
                                                <button 
                                                    className="btn-icon btn-secondary btn-reject"
                                                    onClick={() => handleReject(rec.id)}
                                                    disabled={actionLoading}
                                                    style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600", color: "#475569", transition: "all 0.2s" }}
                                                >
                                                    <X size={16} style={{ marginRight: "4px" }} />
                                                    Reject
                                                </button>
                                                <button 
                                                    className="btn-icon btn-primary btn-approve"
                                                    onClick={() => handleApprove(rec.id)}
                                                    disabled={actionLoading}
                                                    style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", border: "none", borderRadius: "6px", backgroundColor: "#0284c7", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600", color: "#ffffff", transition: "all 0.2s" }}
                                                >
                                                    <Check size={16} style={{ marginRight: "4px" }} />
                                                    Approve Transfer
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
                                                Requires Center Manager or Pharmacist signature of source/destination facility.
                                            </span>
                                        )}
                                    </div>
                                )}

                                {rec.status === "Completed" && (
                                    <div className="status-notice notice-completed">
                                        Stock successfully dispatched. Inventory values adjusted.
                                    </div>
                                )}

                                {rec.status === "Rejected" && (
                                    <div className="status-notice notice-rejected">
                                        This recommendation was declined by District Admin.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* DEMAND FORECASTING TABLE VIEW */
                filteredForecasts.length === 0 ? (
                    <div className="empty-state card">
                        <p>No demand forecasts logged.</p>
                    </div>
                ) : (
                    <div className="table-responsive card">
                        <table className="centres-table">
                            <thead>
                                <tr>
                                    <th>Health Centre</th>
                                    <th>Medicine / Vaccine</th>
                                    <th>Generic formulation</th>
                                    <th>Forecast Date</th>
                                    <th>Forecasted Demand</th>
                                    <th>Confidence Interval (95%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredForecasts.map((f) => (
                                    <tr key={f.id}>
                                        <td>
                                            <strong>{f.health_centre_name}</strong>
                                        </td>
                                        <td>{f.medicine_name}</td>
                                        <td>{f.medicine_generic}</td>
                                        <td>{new Date(f.forecast_date).toLocaleDateString()}</td>
                                        <td>
                                            <strong>{f.forecasted_demand}</strong> <span style={{ fontSize: "0.8rem", color: "#64748b" }}>units</span>
                                        </td>
                                        <td>
                                            <span className="ci-badge">
                                                {f.confidence_interval_lower} - {f.confidence_interval_upper} units
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default AIRecommendationsTab;
