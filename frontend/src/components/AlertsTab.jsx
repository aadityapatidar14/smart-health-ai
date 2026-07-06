import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, CheckCircle, AlertTriangle } from "lucide-react";
import "./AlertsTab.css";

const AlertsTab = ({ token, user }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [alerts, setAlerts] = useState([]);
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("all");

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // alert id
    const [formError, setFormError] = useState("");

    // Inputs
    const [healthCentreId, setHealthCentreId] = useState("");
    const [alertType, setAlertType] = useState("StockOut");
    const [severity, setSeverity] = useState("Low");
    const [message, setMessage] = useState("");
    const [isResolved, setIsResolved] = useState(false);

    const fetchAlerts = async () => {
        try {
            const response = await fetch("http://localhost:5000/alerts", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch alerts");
            }

            setAlerts(data);
            setError("");
        } catch (err) {
            console.error("Fetch alerts error:", err);
            setError(err.message);
        }
    };

    const fetchCentres = async () => {
        try {
            const response = await fetch("http://localhost:5000/centres", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch centres list");
            }

            setCentres(data);
        } catch (err) {
            console.error("Fetch centres error in AlertsTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchAlerts(), fetchCentres()]);
            setLoading(false);
        };

        loadAllData();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setHealthCentreId(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
        setAlertType("StockOut");
        setSeverity("Low");
        setMessage("");
        setIsResolved(false);
        setFormError("");
        setShowForm(false);
    };

    const handleEditClick = (alert) => {
        setEditingId(alert.id);
        setHealthCentreId(alert.health_centre_id || "");
        setAlertType(alert.alert_type || "StockOut");
        setSeverity(alert.severity || "Low");
        setMessage(alert.message || "");
        setIsResolved(alert.is_resolved || false);
        setFormError("");
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!healthCentreId || !alertType || !severity || !message) {
            setFormError("All fields are required.");
            return;
        }

        const payload = {
            health_centre_id: Number(healthCentreId),
            alert_type: alertType,
            severity,
            message,
            is_resolved: isResolved,
        };

        const url = editingId 
            ? `http://localhost:5000/alerts/${editingId}`
            : "http://localhost:5000/alerts";
        
        const method = editingId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save alert details");
            }

            await fetchAlerts();
            resetForm();
        } catch (err) {
            console.error("Save alert error:", err);
            setFormError(err.message);
        }
    };

    const handleResolveClick = async (alert) => {
        const payload = {
            health_centre_id: alert.health_centre_id,
            alert_type: alert.alert_type,
            severity: alert.severity,
            message: alert.message,
            is_resolved: true,
        };

        try {
            const response = await fetch(`http://localhost:5000/alerts/${alert.id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to resolve alert");
            }

            await fetchAlerts();
        } catch (err) {
            console.error("Resolve alert error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteClick = async (id, aType, cName) => {
        if (!window.confirm(`Are you sure you want to delete the "${aType}" alert for "${cName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/alerts/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete alert");
            }

            await fetchAlerts();
        } catch (err) {
            console.error("Delete alert error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    // Filter list by query and severity filter
    const filteredAlerts = alerts.filter(alert => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            alert.alert_type.toLowerCase().includes(query) ||
            alert.severity.toLowerCase().includes(query) ||
            alert.message.toLowerCase().includes(query) ||
            (alert.health_centre_name && alert.health_centre_name.toLowerCase().includes(query))
        );
        const matchesFilter = selectedSeverityFilter === "all" || alert.severity === selectedSeverityFilter;
        // Non-admin official users can only see alerts of their own centre
        const isOfficialUser = user?.role !== "DistrictAdmin" && user?.role !== "Citizen";
        const matchesCentre = !isOfficialUser || Number(alert.health_centre_id) === Number(user.health_centre_id);
        return matchesSearch && matchesFilter && matchesCentre;
    });

    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    return (
        <div className="alerts-tab-container">
            <div className="tab-header">
                <h2>Operational Alerts Dashboard</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Alert
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Alert Logs" : "File Operational Alert"}</h3>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && <div className="error-alert">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="healthCentre">Affected Health Centre *</label>
                                    <select
                                        id="healthCentre"
                                        className="form-control"
                                        value={healthCentreId}
                                        onChange={(e) => setHealthCentreId(e.target.value)}
                                        required
                                        disabled={user?.role === "CenterManager"}
                                    >
                                        <option value="">-- Select Health Centre --</option>
                                        {centres.filter(c => user?.role === "DistrictAdmin" || user?.role === "Citizen" || Number(c.id) === Number(user.health_centre_id)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="alertType">Alert Type Category *</label>
                                    <select
                                        id="alertType"
                                        className="form-control"
                                        value={alertType}
                                        onChange={(e) => setAlertType(e.target.value)}
                                        required
                                    >
                                        <option value="StockOut">StockOut</option>
                                        <option value="LowStock">LowStock</option>
                                        <option value="BedShortage">BedShortage</option>
                                        <option value="DoctorAbsenteeism">DoctorAbsenteeism</option>
                                        <option value="EquipmentFailure">EquipmentFailure</option>
                                        <option value="TestUnavailable">TestUnavailable</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="severity">Severity Level *</label>
                                    <select
                                        id="severity"
                                        className="form-control"
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        required
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                                    <input
                                        type="checkbox"
                                        id="isResolved"
                                        checked={isResolved}
                                        onChange={(e) => setIsResolved(e.target.checked)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                    />
                                    <label htmlFor="isResolved" style={{ margin: 0, cursor: "pointer" }}>Mark Alert as Resolved</label>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="alertMessage">Alert Details Message *</label>
                                <textarea
                                    id="alertMessage"
                                    className="form-control"
                                    rows="2"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Describe the operational incident or alert trigger details..."
                                    required
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "File Alert"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="list-controls">
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Search by facility, alert type, message, or severity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedSeverityFilter}
                        onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading alerts logs...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading alerts: {error}</p>
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="empty-state card">
                    <p>No operational alerts logged.</p>
                </div>
            ) : (
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Health Centre</th>
                                <th>Alert Category</th>
                                <th>Severity</th>
                                <th>Message</th>
                                <th>Logged Date</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlerts.map((alert) => (
                                <tr key={alert.id} className={alert.is_resolved ? "resolved-row" : "unresolved-row"}>
                                    <td>
                                        <strong>{alert.health_centre_name}</strong>
                                    </td>
                                    <td>
                                        <span className="alert-type-badge">{alert.alert_type}</span>
                                    </td>
                                    <td>
                                        <span className={`severity-badge ${alert.severity}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td>{alert.message}</td>
                                    <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                        {formatDate(alert.created_at)}
                                    </td>
                                    <td>
                                        {alert.is_resolved ? (
                                            <div className="resolved-status" title={`Resolved on ${formatDate(alert.resolved_at)}`}>
                                                <CheckCircle size={16} className="resolved-icon" />
                                                <span>Resolved</span>
                                            </div>
                                        ) : (isEditor && (user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(alert.health_centre_id) === Number(user.health_centre_id)))) ? (
                                            <button 
                                                className="btn btn-secondary btn-resolve"
                                                onClick={() => handleResolveClick(alert)}
                                                title="Mark as Resolved"
                                            >
                                                Resolve
                                            </button>
                                        ) : (
                                            <div className="unresolved-status" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "0.875rem" }}>
                                                <AlertTriangle size={16} />
                                                <span>Active</span>
                                            </div>
                                        )}
                                    </td>
                                    {isEditor && (
                                        <td className="table-actions">
                                            {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(alert.health_centre_id) === Number(user.health_centre_id))) ? (
                                                <>
                                                    <button 
                                                        className="btn-icon btn-edit"
                                                        onClick={() => handleEditClick(alert)}
                                                        title="Edit Alert Log"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="btn-icon btn-delete"
                                                        onClick={() => handleDeleteClick(alert.id, alert.alert_type, alert.health_centre_name)}
                                                        title="Delete Alert Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: "0.8rem" }}>ReadOnly</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AlertsTab;
