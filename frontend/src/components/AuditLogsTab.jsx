import React, { useState, useEffect } from "react";
import { Search, Shield, Calendar, Mail, ClipboardList, Plus, Trash2, Activity } from "lucide-react";
import "./AuditLogsTab.css";

const AuditLogsTab = ({ token }) => {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [centres, setCentres] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [catalog, setCatalog] = useState([]);

    const fetchCentres = async () => {
        try {
            const response = await fetch("http://localhost:5000/centres");
            if (response.ok) {
                const data = await response.json();
                setCentres(data);
            }
        } catch (e) {
            console.error("Fetch centres error in audit:", e);
        }
    };

    const fetchMedicines = async () => {
        try {
            const response = await fetch("http://localhost:5000/medicines");
            if (response.ok) {
                const data = await response.json();
                setMedicines(data);
            }
        } catch (e) {
            console.error("Fetch medicines error in audit:", e);
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await fetch("http://localhost:5000/tests/catalog");
            if (response.ok) {
                const data = await response.json();
                setCatalog(data);
            }
        } catch (e) {
            console.error("Fetch test catalog error in audit:", e);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/audit", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch audit logs");
            }
            setLogs(data);
        } catch (err) {
            console.error("Fetch audit logs error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([fetchAuditLogs(), fetchCentres(), fetchMedicines(), fetchCatalog()]);
        };
        loadAll();
    }, [token]);

    // Format dates cleanly
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    // Helper to get avatar color
    const getAvatarColor = (name) => {
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
        if (!name) return colors[0];
        let sum = 0;
        for (let i = 0; i < name.length; i++) {
            sum += name.charCodeAt(i);
        }
        return colors[sum % colors.length];
    };

    const getCentreName = (id) => {
        const c = centres.find(item => String(item.id) === String(id));
        return c ? `${c.name} (${c.type})` : `Centre ID: ${id}`;
    };

    const getMedicineName = (id) => {
        const m = medicines.find(item => String(item.id) === String(id));
        return m ? m.name : `Medicine ID: ${id}`;
    };

    const getTestName = (id) => {
        const t = catalog.find(item => String(item.id) === String(id));
        return t ? t.test_name : `Test ID: ${id}`;
    };

    // Format JSON details nicely into a single, clean, easy-to-understand sentence
    const formatDetails = (detailsStr, action = "", userName = "User") => {
        try {
            const parsed = JSON.parse(detailsStr);
            const body = parsed.body || {};
            const params = parsed.params || {};
            const response = parsed.response || {};
            const act = action.toUpperCase();

            let description = "";
            const actor = userName;

            // Resolve medicine_id, health_centre_id, test_id if they exist inside response/body
            const medId = body.medicine_id || (response.inventory && response.inventory.medicine_id) || response.medicine_id || "";
            const centreId = body.health_centre_id || (response.inventory && response.inventory.health_centre_id) || (response.test && response.test.health_centre_id) || response.health_centre_id || body.centre_id || "";
            const testIdVal = body.test_id || (response.test && response.test.test_id) || response.test_id || "";

            const medName = medId ? getMedicineName(medId) : "";
            const centreName = centreId ? getCentreName(centreId) : "";
            const testName = testIdVal ? getTestName(testIdVal) : "";

            switch (act) {
                case "CREATE_MEDICINE":
                    description = `${actor} registered a new medicine: "${body.name || ''}" (${body.generic_name || ''}) under "${body.category || ''}" category.`;
                    break;
                case "CREATE_STOCK":
                    description = `${actor} recorded a new inventory stock of ${body.current_stock || '0'} units of ${medName || 'medicine'} at ${centreName || 'health centre'}.`;
                    break;
                case "UPDATE_STOCK":
                    description = `${actor} updated stock levels for ${medName || 'medicine'} at ${centreName || 'health centre'}: Current Stock set to ${body.current_stock || '0'} units, Min Required to ${body.min_required_stock || '0'} units.`;
                    break;
                case "DELETE_STOCK":
                    description = `${actor} removed the stock record of ${medName || 'medicine'} at ${centreName || 'health centre'}.`;
                    break;
                case "CREATE_TEST":
                    description = `${actor} added diagnostic service "${testName || 'test'}" at ${centreName || 'health centre'} with a daily capacity of ${body.daily_capacity || '0'} tests.`;
                    break;
                case "DELETE_TEST":
                    description = `${actor} removed diagnostic service availability of "${testName || 'test'}" at ${centreName || 'health centre'}.`;
                    break;
                case "UPDATE_ALERT":
                    description = `${actor} updated alert (ID: ${params.id || '—'}) status to "${body.status || ''}" ${body.resolution_notes ? `with notes: "${body.resolution_notes}"` : ''}.`;
                    break;
                case "UPDATE_BED":
                    description = `${actor} updated Bed (ID: ${params.id || '—'}) status to "${body.status || ''}" at ${centreName || 'health centre'}.`;
                    break;
                case "UPDATE_DOCTOR":
                    description = `${actor} updated Doctor profile (ID: ${params.id || '—'}): Specialization set to "${body.specialization || ''}", Degree set to "${body.degree || ''}" at ${centreName || 'health centre'}.`;
                    break;
                case "UPDATE_DOCTOR_LIVE_STATUS":
                    description = `${actor} checked ${body.is_checked_in ? 'IN' : 'OUT'} (Status: "${body.status || 'Active'}").`;
                    break;
                case "CREATE_PATIENT":
                    description = `${actor} registered a new patient admission: "${body.name || ''}" at ${centreName || 'health centre'} for reason: "${body.admission_reason || ''}".`;
                    break;
                case "UPDATE_PATIENT":
                    description = `${actor} updated patient admission details for "${body.name || ''}" (ID: ${params.id || '—'}) at ${centreName || 'health centre'}: Status set to "${body.status || ''}".`;
                    break;
                case "DELETE_PATIENT":
                    description = `${actor} discharged/removed patient admission record (ID: ${params.id || '—'}) for patient: "${response.patient ? response.patient.name : 'patient'}".`;
                    break;
                default:
                    // Fallback listing
                    const changes = [];
                    for (const [key, val] of Object.entries(body)) {
                        if (key.toLowerCase().includes("password")) continue;
                        changes.push(`${key.replace(/_/g, ' ')}: ${val}`);
                    }
                    if (changes.length > 0) {
                        description = `${actor} changed: ${changes.join(', ')}`;
                    } else if (params.id) {
                        description = `${actor} modified record ID: ${params.id}`;
                    } else {
                        description = `${actor} performed action.`;
                    }
            }

            return description;
        } catch (e) {
            return detailsStr || "—";
        }
    };

    // Calculate metrics
    const totalCount = logs.length;
    const creationCount = logs.filter(log => log.action.toUpperCase().includes("CREATE")).length;
    const updateCount = logs.filter(log => log.action.toUpperCase().includes("UPDATE")).length;
    const deletionCount = logs.filter(log => log.action.toUpperCase().includes("DELETE")).length;

    // Filter logs by tab & search query
    const filteredLogs = logs.filter(log => {
        const query = searchQuery.toLowerCase();
        
        // Search match
        const matchesSearch = (
            (log.user_email && log.user_email.toLowerCase().includes(query)) ||
            (log.user_name && log.user_name.toLowerCase().includes(query)) ||
            (log.action && log.action.toLowerCase().includes(query)) ||
            (log.details && log.details.toLowerCase().includes(query))
        );

        // Tab match
        let matchesTab = true;
        if (activeTab === "creations") {
            matchesTab = log.action.toUpperCase().includes("CREATE");
        } else if (activeTab === "updates") {
            matchesTab = log.action.toUpperCase().includes("UPDATE");
        } else if (activeTab === "deletions") {
            matchesTab = log.action.toUpperCase().includes("DELETE");
        }

        return matchesSearch && matchesTab;
    });

    // Helper to render timeline badge
    const renderTimelineBadge = (action = "") => {
        const act = action.toUpperCase();
        if (act.includes("CREATE")) {
            return (
                <div className="audit-timeline-badge create" title="Record Created">
                    <Plus size={14} />
                </div>
            );
        } else if (act.includes("UPDATE")) {
            return (
                <div className="audit-timeline-badge update" title="Record Updated">
                    <Activity size={14} />
                </div>
            );
        } else if (act.includes("DELETE")) {
            return (
                <div className="audit-timeline-badge delete" title="Record Deleted">
                    <Trash2 size={14} />
                </div>
            );
        }
        return (
            <div className="audit-timeline-badge default" title="Action Logged">
                <Shield size={14} />
            </div>
        );
    };

    const getActionClass = (action = "") => {
        const act = action.toUpperCase();
        if (act.includes("CREATE")) return "create";
        if (act.includes("UPDATE")) return "update";
        if (act.includes("DELETE")) return "delete";
        return "default";
    };

    return (
        <div className="audit-logs-container">
            <div className="tab-header" style={{ marginBottom: "0" }}>
                <div className="header-info">
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Shield size={28} style={{ color: "#0f172a" }} />
                        Administrative Audit Trail
                    </h1>
                    <p className="text-muted">Real-time security log of database mutations, staff updates, and resource adjustments.</p>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="audit-metrics-grid">
                <div className="audit-metric-card">
                    <div className="audit-metric-icon blue">
                        <ClipboardList size={22} />
                    </div>
                    <div className="audit-metric-details">
                        <span className="audit-metric-value">{totalCount}</span>
                        <span className="audit-metric-label">Total Events</span>
                    </div>
                </div>

                <div className="audit-metric-card">
                    <div className="audit-metric-icon green">
                        <Plus size={22} />
                    </div>
                    <div className="audit-metric-details">
                        <span className="audit-metric-value">{creationCount}</span>
                        <span className="audit-metric-label">Creations</span>
                    </div>
                </div>

                <div className="audit-metric-card">
                    <div className="audit-metric-icon amber">
                        <Activity size={22} />
                    </div>
                    <div className="audit-metric-details">
                        <span className="audit-metric-value">{updateCount}</span>
                        <span className="audit-metric-label">Updates</span>
                    </div>
                </div>

                <div className="audit-metric-card">
                    <div className="audit-metric-icon red">
                        <Trash2 size={22} />
                    </div>
                    <div className="audit-metric-details">
                        <span className="audit-metric-value">{deletionCount}</span>
                        <span className="audit-metric-label">Deletions</span>
                    </div>
                </div>
            </div>

            {/* Toolbar and filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="search-bar-wrapper" style={{ margin: "0" }}>
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Search logs by email, name, action details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="audit-filter-tabs">
                    <button 
                        className={`audit-filter-tab ${activeTab === "all" ? "active" : ""}`}
                        onClick={() => setActiveTab("all")}
                    >
                        All Activities ({totalCount})
                    </button>
                    <button 
                        className={`audit-filter-tab ${activeTab === "creations" ? "active" : ""}`}
                        onClick={() => setActiveTab("creations")}
                    >
                        Creations ({creationCount})
                    </button>
                    <button 
                        className={`audit-filter-tab ${activeTab === "updates" ? "active" : ""}`}
                        onClick={() => setActiveTab("updates")}
                    >
                        Updates ({updateCount})
                    </button>
                    <button 
                        className={`audit-filter-tab ${activeTab === "deletions" ? "active" : ""}`}
                        onClick={() => setActiveTab("deletions")}
                    >
                        Deletions ({deletionCount})
                    </button>
                </div>
            </div>

            {/* Loading / Empty / Content states */}
            {loading ? (
                <div className="loading-state" style={{ padding: "40px" }}>
                    <p>Loading security audit logs...</p>
                </div>
            ) : error ? (
                <div className="error-state card" style={{ padding: "30px", border: "1px solid #fee2e2" }}>
                    <p className="text-danger">⚠️ Error loading audit logs: {error}</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="empty-state card" style={{ padding: "40px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <p className="text-muted">No audit trail records match your current filter query.</p>
                </div>
            ) : (
                <div className="audit-timeline">
                    {filteredLogs.map((log) => {
                        const description = formatDetails(log.details, log.action, log.user_name);
                        return (
                            <div key={log.id} className="audit-timeline-item">
                                {renderTimelineBadge(log.action)}
                                <div className="audit-timeline-card">
                                    <div className="audit-card-header">
                                        <div className="audit-actor-info">
                                            <div 
                                                className="audit-actor-avatar"
                                                style={{ backgroundColor: getAvatarColor(log.user_name) }}
                                            >
                                                {getInitials(log.user_name)}
                                            </div>
                                            <div className="audit-actor-details">
                                                <span className="audit-actor-name">{log.user_name}</span>
                                                <span className="audit-actor-email">
                                                    <Mail size={10} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                                    {log.user_email}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="audit-right-meta">
                                            <span className={`audit-action-pill ${getActionClass(log.action)}`}>
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                            <span className="audit-timestamp">
                                                <Calendar size={12} />
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="audit-card-body">
                                        {description}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AuditLogsTab;
