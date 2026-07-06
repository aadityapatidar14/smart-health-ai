import React, { useState, useEffect, useMemo } from "react";
import { 
    Home, Users, Bed, AlertTriangle, Package, LogOut, Building2, 
    Archive, Sparkles, Wrench, Microscope, Activity, Bell, Shield, Check
} from "lucide-react";
import CentresTab from "./CentresTab";
import DoctorsTab from "./DoctorsTab";
import MedicinesTab from "./MedicinesTab";
import BedsTab from "./BedsTab";
import AlertsTab from "./AlertsTab";
import InventoryTab from "./InventoryTab";
import AIRecommendationsTab from "./AIRecommendationsTab";
import EquipmentTab from "./EquipmentTab";
import TestsTab from "./TestsTab";
import FootfallTab from "./FootfallTab";
import AuditLogsTab from "./AuditLogsTab";
import "./Dashboard.css";

const DirectEditView = ({ token, user, userCentreName }) => {
    const [directSubTab, setDirectSubTab] = useState("");

    // Initialize the default sub-tab based on user role
    useEffect(() => {
        if (user.role === "CenterManager") {
            setDirectSubTab("doctors");
        } else if (user.role === "Pharmacist") {
            setDirectSubTab("inventory");
        } else if (user.role === "LabTechnician") {
            setDirectSubTab("tests");
        } else if (user.role === "Doctor") {
            setDirectSubTab("check-in");
        }
    }, [user]);

    // If doctor role, we show a check-in card
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const fetchDoctorProfile = async () => {
        try {
            setLoadingProfile(true);
            const response = await fetch("http://localhost:5000/doctors", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const doctorsList = await response.json();
                const currentDoc = doctorsList.find(d => Number(d.user_id) === Number(user.id));
                setDoctorProfile(currentDoc);
            }
        } catch (err) {
            console.error("Error loading doctor profile:", err);
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (directSubTab === "check-in" && user.role === "Doctor") {
            fetchDoctorProfile();
        }
    }, [directSubTab, user]);

    const handleDoctorLiveStatusUpdate = async (newStatus) => {
        if (!doctorProfile) return;
        try {
            const response = await fetch(`http://localhost:5000/doctors/${doctorProfile.doctor_id}/live-status`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchDoctorProfile();
            } else {
                const data = await response.json();
                alert(data.message || "Failed to update attendance");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating status: " + err.message);
        }
    };

    const getStatusBgColor = (liveStatus) => {
        switch (liveStatus) {
            case "Present": return "#f0fdf4";
            case "Absent": return "#fef2f2";
            case "On Leave": return "#fffbeb";
            case "Emergency Callout": return "#f0f9ff";
            default: return "#f1f5f9";
        }
    };

    const [centreAlerts, setCentreAlerts] = useState([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    const fetchCentreAlerts = async () => {
        try {
            setLoadingAlerts(true);
            const response = await fetch("http://localhost:5000/alerts", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const allAlerts = await response.json();
                // Filter unresolved alerts for their assigned centre
                const match = allAlerts.filter(a => Number(a.health_centre_id) === Number(user.health_centre_id) && !a.is_resolved);
                setCentreAlerts(match);
            }
        } catch (err) {
            console.error("Error loading center alerts:", err);
        } finally {
            setLoadingAlerts(false);
        }
    };

    useEffect(() => {
        if (user.health_centre_id) {
            fetchCentreAlerts();
        }
    }, [user]);

    const getStatusTextColor = (liveStatus) => {
        switch (liveStatus) {
            case "Present": return "#166534";
            case "Absent": return "#991b1b";
            case "On Leave": return "#92400e";
            case "Emergency Callout": return "#075985";
            default: return "#475569";
        }
    };

    return (
        <div className="direct-edit-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="direct-edit-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Activity size={24} style={{ color: "#4f46e5" }} />
                        {userCentreName ? `${userCentreName} Console` : "Workplace Console"}
                    </h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                        Quick access interface for {user.name} ({user.role}).
                      </p>
                </div>
            </div>

            {/* Facility Alerts Section */}
            {user.health_centre_id && (
                <div className="centre-alerts-wrapper" style={{ marginBottom: "10px" }}>
                    {loadingAlerts ? (
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Checking for active alerts...</p>
                    ) : centreAlerts.length > 0 ? (
                        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "16px" }}>
                            <h4 style={{ margin: "0 0 10px 0", color: "#991b1b", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                                <AlertTriangle size={18} />
                                Active Safety Alerts for {userCentreName || "Your Centre"} ({centreAlerts.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {centreAlerts.map(alert => (
                                    <div key={alert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span className={`user-badge ${alert.severity === "Critical" || alert.severity === "High" ? "error-alert" : "warning-alert"}`} style={{ fontSize: "0.7rem", padding: "2px 6px", margin: 0 }}>
                                                {alert.severity}
                                            </span>
                                            <span style={{ fontSize: "0.85rem", color: "#374151" }}>{alert.message}</span>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                            {new Date(alert.created_at).toLocaleString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "numeric",
                                                month: "short"
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Check size={18} style={{ color: "#166534" }} />
                            <span style={{ color: "#166534", fontSize: "0.875rem", fontWeight: 600 }}>All resource safety monitors are green. No active alerts for your facility.</span>
                        </div>
                    )}
                </div>
            )}

             {/* Sub-tab selection bar for CenterManager */}
            {user.role === "CenterManager" && (
                <div className="direct-subtabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap" }}>
                    <button 
                        className={`btn ${directSubTab === "doctors" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("doctors")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Manage Doctors
                    </button>
                    <button 
                        className={`btn ${directSubTab === "beds" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("beds")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Manage Beds
                    </button>
                    <button 
                        className={`btn ${directSubTab === "equipment" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("equipment")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Manage Equipment
                    </button>
                    <button 
                        className={`btn ${directSubTab === "inventory" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("inventory")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Manage Inventory
                    </button>
                    <button 
                        className={`btn ${directSubTab === "tests" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("tests")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Manage Diagnostic Services
                    </button>
                    <button 
                        className={`btn ${directSubTab === "footfall" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setDirectSubTab("footfall")}
                        style={{ borderRadius: "20px", padding: "6px 16px" }}
                    >
                        Log Hourly Footfall
                    </button>
                </div>
            )}

            {/* Direct edit panels rendering */}
            <div className="direct-edit-panel">
                {user.role === "CenterManager" && directSubTab === "doctors" && (
                    <DoctorsTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}
                {user.role === "CenterManager" && directSubTab === "beds" && (
                    <BedsTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}
                {user.role === "CenterManager" && directSubTab === "equipment" && (
                    <EquipmentTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}
                {user.role === "CenterManager" && directSubTab === "inventory" && (
                    <InventoryTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}
                {user.role === "CenterManager" && directSubTab === "tests" && (
                    <TestsTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}
                {user.role === "CenterManager" && directSubTab === "footfall" && (
                    <FootfallTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}

                {/* Pharmacist directly edits inventory */}
                {user.role === "Pharmacist" && (
                    <InventoryTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}

                {/* LabTechnician directly edits tests */}
                {user.role === "LabTechnician" && (
                    <TestsTab token={token} user={user} filterCentreId={user.health_centre_id} />
                )}

                {/* Doctor directly updates attendance check-in card */}
                {user.role === "Doctor" && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                        {loadingProfile ? (
                            <p>Fetching doctor registry profile...</p>
                        ) : doctorProfile ? (
                            <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "30px", border: "1px solid #cbd5e1" }}>
                                <div style={{ textAlign: "center", marginBottom: "25px" }}>
                                    <h3 style={{ margin: "0 0 8px 0", fontSize: "1.4rem", color: "#1e293b" }}>{doctorProfile.name}</h3>
                                    <span className="user-badge" style={{ backgroundColor: "#e0e7ff", color: "#4338ca", padding: "4px 12px", display: "inline-block" }}>
                                        {doctorProfile.specialization} ({doctorProfile.degree})
                                    </span>
                                    <p style={{ margin: "10px 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                                        Workplace: <strong>{doctorProfile.health_centre_name || "Unassigned"}</strong>
                                    </p>
                                </div>

                                <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Current Live Attendance Status</span>
                                    <br />
                                    <h4 style={{ 
                                        margin: "10px 0 0 0", 
                                        fontSize: "1.6rem", 
                                        color: getStatusTextColor(doctorProfile.live_status),
                                        backgroundColor: getStatusBgColor(doctorProfile.live_status),
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        display: "inline-block"
                                    }}>
                                        {doctorProfile.live_status || "Not Marked"}
                                    </h4>
                                </div>

                                <div style={{ marginTop: "30px" }}>
                                    <h5 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "1rem", textAlign: "center" }}>Check-in / Change Status</h5>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleDoctorLiveStatusUpdate("Present")}
                                            style={{ backgroundColor: "#10b981", color: "#ffffff", borderColor: "#10b981", fontWeight: 700 }}
                                        >
                                            Present
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleDoctorLiveStatusUpdate("Absent")}
                                            style={{ backgroundColor: "#ef4444", color: "#ffffff", borderColor: "#ef4444", fontWeight: 700 }}
                                        >
                                            Absent
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleDoctorLiveStatusUpdate("On Leave")}
                                            style={{ backgroundColor: "#f59e0b", color: "#ffffff", borderColor: "#f59e0b", fontWeight: 700 }}
                                        >
                                            On Leave
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleDoctorLiveStatusUpdate("Emergency Callout")}
                                            style={{ backgroundColor: "#06b6d4", color: "#ffffff", borderColor: "#06b6d4", fontWeight: 700 }}
                                        >
                                            Emergency Callout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: "30px", textAlign: "center" }}>
                                <p className="text-danger">⚠️ No matching doctor profile found in the registry for user {user.name}.</p>
                                <p style={{ color: "#64748b" }}>Please contact the District Administrator to link your account to the Doctors registry.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({ user, token, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview"); 
    const [citizenName, setCitizenName] = useState(() => localStorage.getItem("citizen_name") || "");
    const [hoveredPoint, setHoveredPoint] = useState(null);
    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Facility Filter State
    const [centres, setCentres] = useState([]);
    const [selectedCentreFilter, setSelectedCentreFilter] = useState(
        user.role === "DistrictAdmin" ? "all" : String(user.health_centre_id)
    );

    // Load Health Centres for filtering dropdown
    useEffect(() => {
        const fetchCentresList = async () => {
            try {
                const response = await fetch("http://localhost:5000/centres");
                if (response.ok) {
                    const data = await response.json();
                    setCentres(data);
                }
            } catch (err) {
                console.error("Dashboard fetch centres error:", err);
            }
        };
        fetchCentresList();
    }, []);

    const userCentreName = useMemo(() => {
        if (!user || !user.health_centre_id) return "";
        const matched = centres.find(c => Number(c.id) === Number(user.health_centre_id));
        return matched ? matched.name : "";
    }, [centres, user]);

    // Redirect citizens if activeTab is overview
    useEffect(() => {
        if (user.role === "Citizen" && activeTab === "overview") {
            setActiveTab("centres");
        }
    }, [user, activeTab]);

    const handleLogout = () => {
        localStorage.removeItem("citizen_name");
        onLogout();
    };

    // Load Notifications and Poll every 20s
    const fetchNotifications = async () => {
        try {
            const response = await fetch("http://localhost:5000/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error("Dashboard fetch notifications error:", err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 20000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleMarkAsRead = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/${id}/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch("http://localhost:5000/notifications/read-all", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
        }
    };

    // Load Statistics (reactive to selected centre filter)
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const url = selectedCentreFilter !== "all" 
                ? `http://localhost:5000/dashboard?health_centre_id=${selectedCentreFilter}`
                : "http://localhost:5000/dashboard";

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load dashboard data");
            }

            setStats(data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "overview") {
            fetchDashboardData();
        }
    }, [token, activeTab, selectedCentreFilter]);

    // Bed Stats Aggregator
    const bedStats = useMemo(() => {
        if (!stats || !stats.bedBreakdown) return null;
        const total = stats.bedBreakdown.reduce((sum, item) => sum + Number(item.count), 0);
        const occupied = stats.bedBreakdown.filter(item => item.status === 'Occupied').reduce((sum, item) => sum + Number(item.count), 0);
        const available = stats.bedBreakdown.filter(item => item.status === 'Available').reduce((sum, item) => sum + Number(item.count), 0);
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { total, occupied, available, rate };
    }, [stats]);

    // Footfall Trend Aggregator
    const footfallData = useMemo(() => {
        if (!stats || !stats.footfallBreakdown || stats.footfallBreakdown.length === 0) return null;
        const breakdown = stats.footfallBreakdown;
        const maxTotal = Math.max(...breakdown.map(h => (h.op || 0) + (h.ip || 0) + (h.er || 0)), 1);
        
        const points = breakdown.map(h => {
            const x = 30 + (h.hourly_slot * (290 / 23));
            const total = (h.op || 0) + (h.ip || 0) + (h.er || 0);
            const y = 135 - (total * (90 / maxTotal));
            return { x, y, slot: h.hourly_slot, total, wait: h.wait_time };
        });

        const pathD = points.reduce((acc, p, idx) => {
            return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
        }, "");

        const areaD = points.length > 0
            ? `${pathD} L ${points[points.length - 1].x} 135 L ${points[0].x} 135 Z`
            : "";

        return { points, pathD, areaD, maxTotal };
    }, [stats]);

    const formatSlotLabel = (slot) => {
        if (slot === 0) return "12 AM";
        if (slot === 12) return "12 PM";
        return slot > 12 ? `${slot - 12} PM` : `${slot} AM`;
    };

    const footfallAnalytics = useMemo(() => {
        if (!footfallData || footfallData.points.length === 0) return null;
        const peakPoint = footfallData.points.reduce((max, p) => p.total > max.total ? p : max, footfallData.points[0]);
        const sum = footfallData.points.reduce((acc, p) => acc + p.total, 0);
        const avg = Math.round(sum / footfallData.points.length);
        return {
            peakHour: formatSlotLabel(peakPoint.slot),
            peakValue: peakPoint.total,
            avgValue: avg
        };
    }, [footfallData]);

    // Stock Stats Aggregator
    const stockStats = useMemo(() => {
        if (!stats || !stats.stockBreakdown) return null;
        const s = stats.stockBreakdown;
        const total = Number(s.stock_out) + Number(s.low_stock) + Number(s.normal_stock);
        const outPct = total > 0 ? Math.round((Number(s.stock_out) / total) * 100) : 0;
        const lowPct = total > 0 ? Math.round((Number(s.low_stock) / total) * 100) : 0;
        const normalPct = total > 0 ? (100 - outPct - lowPct) : 0;
        return { total, out: Number(s.stock_out), low: Number(s.low_stock), normal: Number(s.normal_stock), outPct, lowPct, normalPct };
    }, [stats]);

    return (
        <div className="dashboard-layout" onClick={() => setShowNotifications(false)}>
            <header className="dashboard-header">
                <div className="header-brand">
                    <h1>{user.role === "Citizen" ? "Health Portal" : "Smart Health Panel"}</h1>
                </div>
                <div className="header-right">
                    {user.role !== "Citizen" && (
                        <>
                            <div 
                                className="notification-bell-wrapper" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNotifications(!showNotifications);
                                }}
                                title="Alert Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
                            </div>

                            {/* Notification Dropdown Drawer */}
                            {showNotifications && (
                                <div className="notifications-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="notifications-header">
                                        <h3>Operational Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button className="btn-link-all" onClick={handleMarkAllAsRead}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">No new notifications.</div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div 
                                                    key={n.id} 
                                                    className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                                                    onClick={() => {
                                                        if (!n.is_read) handleMarkAsRead(n.id);
                                                    }}
                                                >
                                                    <div className="notification-item-title">
                                                        <span>{n.title}</span>
                                                        {!n.is_read && <span style={{ fontSize: "0.65rem", color: "#0284c7" }}>New</span>}
                                                    </div>
                                                    <div className="notification-item-message">{n.message}</div>
                                                    <div className="notification-item-time">
                                                        {n.health_centre_name ? `${n.health_centre_name} • ` : ""}
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="header-user-actions" style={{ display: "flex", alignItems: "center" }}>
                        {user.role !== "DistrictAdmin" && user.role !== "Citizen" && (
                            <button 
                                className={`btn btn-workplace-console ${activeTab === "direct-edit" ? "active" : ""}`}
                                onClick={() => setActiveTab("direct-edit")}
                                style={{ marginRight: "16px" }}
                            >
                                <Activity size={16} />
                                {userCentreName ? `${userCentreName} Console` : "Workplace Console"}
                            </button>
                        )}
                        <span className="user-badge">{user.role}</span>
                        <span className="user-name">Welcome, <strong>{user.role === "Citizen" && citizenName ? citizenName : user.name}</strong></span>
                        <button className="btn btn-danger btn-logout" onClick={handleLogout}>
                            <LogOut size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-body">
                <aside className="dashboard-sidebar">
                    <nav className="sidebar-nav">
                        {user.role !== "Citizen" && (
                            <button 
                                className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                            >
                                <Home size={18} />
                                <span>Overview</span>
                            </button>
                        )}
                        <button 
                            className={`nav-item ${activeTab === "centres" ? "active" : ""}`}
                            onClick={() => setActiveTab("centres")}
                        >
                            <Building2 size={18} />
                            <span>Health Centres</span>
                        </button>
                        {user.role !== "Citizen" && (
                            <>
                                <button 
                                    className={`nav-item ${activeTab === "doctors" ? "active" : ""}`}
                                    onClick={() => setActiveTab("doctors")}
                                >
                                    <Users size={18} />
                                    <span>Doctors</span>
                                </button>
                                <button 
                                    className={`nav-item ${activeTab === "medicines" ? "active" : ""}`}
                                    onClick={() => setActiveTab("medicines")}
                                >
                                    <Package size={18} />
                                    <span>Medicines</span>
                                </button>
                            </>
                        )}
                        <button 
                            className={`nav-item ${activeTab === "beds" ? "active" : ""}`}
                            onClick={() => setActiveTab("beds")}
                        >
                            <Bed size={18} />
                            <span>Beds</span>
                        </button>
                        <button 
                            className={`nav-item ${activeTab === "equipment" ? "active" : ""}`}
                            onClick={() => setActiveTab("equipment")}
                        >
                            <Wrench size={18} />
                            <span>Equipment</span>
                        </button>
                        <button 
                            className={`nav-item ${activeTab === "tests" ? "active" : ""}`}
                            onClick={() => setActiveTab("tests")}
                        >
                            <Microscope size={18} />
                            <span>Diagnostic Tests</span>
                        </button>
                        <button 
                            className={`nav-item ${activeTab === "footfall" ? "active" : ""}`}
                            onClick={() => setActiveTab("footfall")}
                        >
                            <Activity size={18} />
                            <span>Patient Footfall</span>
                        </button>
                        {user.role !== "Citizen" && (
                            <button 
                                className={`nav-item ${activeTab === "inventory" ? "active" : ""}`}
                                onClick={() => setActiveTab("inventory")}
                            >
                                <Archive size={18} />
                                <span>Inventory</span>
                            </button>
                        )}
                        {user.role === "DistrictAdmin" && (
                            <>
                                <button 
                                    className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
                                    onClick={() => setActiveTab("alerts")}
                                >
                                    <AlertTriangle size={18} />
                                    <span>Alerts</span>
                                </button>
                                <button 
                                    className={`nav-item ${activeTab === "ai-engine" ? "active" : ""}`}
                                    onClick={() => setActiveTab("ai-engine")}
                                >
                                    <Sparkles size={18} />
                                    <span>AI Recommendations</span>
                                </button>
                            </>
                        )}
                        {/* Audit Trail Sidebar Navigation (DistrictAdmin only) */}
                        {user.role === "DistrictAdmin" && (
                            <button 
                                className={`nav-item ${activeTab === "audit-logs" ? "active" : ""}`}
                                onClick={() => setActiveTab("audit-logs")}
                            >
                                <Shield size={18} />
                                <span>Audit Trail</span>
                            </button>
                        )}
                    </nav>
                </aside>

                <main className="dashboard-main-content">
                    {activeTab === "overview" && user.role !== "Citizen" && (
                        <div className="tab-pane">
                            <div className="overview-controls">
                                <div className="welcome-banner card" style={{ marginBottom: 0, flex: 1 }}>
                                    <h2>Overview Dashboard</h2>
                                    <p>Real-time healthcare facility resources, logistics, and alerts for Indore District.</p>
                                </div>
                                
                                {/* Facility Dropdown Filter */}
                                <div className="facility-filter-wrapper card" style={{ padding: "12px 18px", alignSelf: "stretch" }}>
                                    <label htmlFor="centreFilter" className="facility-filter-label">Viewing Facility:</label>
                                    <select
                                        id="centreFilter"
                                        className="facility-filter-select"
                                        value={selectedCentreFilter}
                                        onChange={(e) => setSelectedCentreFilter(e.target.value)}
                                        disabled={user.role !== "DistrictAdmin"}
                                    >
                                        {user.role === "DistrictAdmin" && <option value="all">District-wide (All Centres)</option>}
                                        {centres.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loading && (
                                <div className="loading-state">
                                    <p>Loading dashboard statistics...</p>
                                </div>
                            )}

                            {error && (
                                <div className="error-state card">
                                    <p className="text-danger">⚠️ Error loading statistics: {error}</p>
                                </div>
                            )}

                            {!loading && !error && stats && (
                                <>
                                    <div className="stats-grid">
                                        {user.role === "DistrictAdmin" && (
                                            <div className="stat-card card" onClick={() => setActiveTab("centres")}>
                                                <div className="stat-icon-wrapper blue">
                                                    <Building2 size={28} />
                                                </div>
                                                <div className="stat-info">
                                                    <span className="stat-label">Health Centres</span>
                                                    <span className="stat-value">{stats.totalCentres}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`stat-card card ${user.role === "Citizen" ? "no-click" : ""}`} onClick={user.role !== "Citizen" ? () => setActiveTab("doctors") : undefined}>
                                            <div className="stat-icon-wrapper green">
                                                <Users size={28} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Total Doctors</span>
                                                <span className="stat-value">{stats.totalDoctors}</span>
                                            </div>
                                        </div>

                                        <div className="stat-card card" onClick={() => setActiveTab("beds")}>
                                            <div className="stat-icon-wrapper indigo">
                                                <Bed size={28} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Available Beds</span>
                                                <span className="stat-value">{stats.availableBeds}</span>
                                            </div>
                                        </div>

                                        {user.role === "DistrictAdmin" && (
                                            <div className={`stat-card card ${user.role === "Citizen" ? "no-click" : ""}`} onClick={user.role !== "Citizen" ? () => setActiveTab("alerts") : undefined}>
                                                <div className="stat-icon-wrapper red">
                                                    <AlertTriangle size={28} />
                                                </div>
                                                <div className="stat-info">
                                                    <span className="stat-label">Active Alerts</span>
                                                    <span className="stat-value">{stats.activeAlerts}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`stat-card card ${user.role === "Citizen" ? "no-click" : ""}`} onClick={user.role !== "Citizen" ? () => setActiveTab("medicines") : undefined}>
                                            <div className="stat-icon-wrapper orange">
                                                <Package size={28} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-label">Total Medicines</span>
                                                <span className="stat-value">{stats.totalMedicines}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts Section */}
                                    <h3 className="charts-section-title">Visual Analytics & Performance Metrics</h3>
                                    <div className="charts-grid">
                                        
                                        {/* Donut Chart: Bed Occupancy */}
                                        <div className="chart-card card">
                                            <h4 className="chart-card-title">
                                                <Bed size={18} style={{ color: "#3b82f6" }} />
                                                Bed Occupancy Rate
                                            </h4>
                                            <div className="chart-container-flex">
                                                {bedStats && bedStats.total > 0 ? (
                                                    <>
                                                        <div className="chart-donut-wrapper">
                                                            <svg width="140" height="140" viewBox="0 0 36 36">
                                                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3"
                                                                        strokeDasharray={`${bedStats.rate} ${100 - bedStats.rate}`}
                                                                        strokeDashoffset="25" strokeLinecap="round" />
                                                            </svg>
                                                            <div className="chart-donut-center">
                                                                <span className="chart-donut-number">{bedStats.rate}%</span>
                                                                <span className="chart-donut-label">Occupied</span>
                                                            </div>
                                                        </div>
                                                        <div className="chart-legend-grid">
                                                            <div className="chart-legend-item">
                                                                <span className="legend-color-label">
                                                                    <span className="legend-dot" style={{ backgroundColor: "#3b82f6" }}></span>
                                                                    Occupied
                                                                </span>
                                                                <span className="legend-value">{bedStats.occupied}</span>
                                                            </div>
                                                            <div className="chart-legend-item">
                                                                <span className="legend-color-label">
                                                                    <span className="legend-dot" style={{ backgroundColor: "#e2e8f0" }}></span>
                                                                    Available
                                                                </span>
                                                                <span className="legend-value">{bedStats.available}</span>
                                                            </div>
                                                            <div className="chart-legend-item" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "4px", marginTop: "4px" }}>
                                                                <span className="legend-color-label" style={{ fontWeight: 600 }}>Total Capacity</span>
                                                                <span className="legend-value">{bedStats.total}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-muted" style={{ padding: "20px" }}>No bed allocations found.</div>
                                                )}
                                            </div>
                                        </div>

                                        {user.role !== "LabTechnician" && user.role !== "Pharmacist" && (
                                            <div className="chart-card card" style={{ gridColumn: "span 2", position: "relative" }}>
                                                <h4 className="chart-card-title">
                                                    <Activity size={18} style={{ color: "#0284c7" }} />
                                                    Hourly Patient Traffic Trend (Aggregate OPD + Inpatients + Emergency)
                                                </h4>
                                                
                                                {footfallAnalytics && (
                                                    <div style={{ display: "flex", gap: "20px", marginBottom: "15px", backgroundColor: "#f8fafc", padding: "10px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, display: "block" }}>PEAK TRAFFIC HOUR</span>
                                                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{footfallAnalytics.peakHour} ({footfallAnalytics.peakValue} Patients)</strong>
                                                        </div>
                                                        <div style={{ flex: 1, borderLeft: "1px solid #e2e8f0", paddingLeft: "20px" }}>
                                                            <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, display: "block" }}>AVG HOURLY INTAKE</span>
                                                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{footfallAnalytics.avgValue} Patients/hr</strong>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="chart-container-flex" style={{ display: "block", minHeight: "160px", position: "relative" }}>
                                                    {footfallData ? (
                                                        <div style={{ width: "100%", height: "160px", position: "relative" }}>
                                                            <svg width="100%" height="160" viewBox="0 0 350 160" preserveAspectRatio="none">
                                                                <defs>
                                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                                                                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                                                                    </linearGradient>
                                                                </defs>
                                                                
                                                                {/* Horizontal Grid lines */}
                                                                <line x1="30" y1="35" x2="340" y2="35" stroke="#f1f5f9" strokeWidth="1" />
                                                                <line x1="30" y1="85" x2="340" y2="85" stroke="#f1f5f9" strokeWidth="1" />
                                                                <line x1="30" y1="135" x2="340" y2="135" stroke="#cbd5e1" strokeWidth="1.5" />
                                                                
                                                                {/* Vertical Grid lines */}
                                                                <line x1="30" y1="20" x2="30" y2="135" stroke="#cbd5e1" strokeWidth="1" />
                                                                
                                                                {/* Hover guideline */}
                                                                {hoveredPoint && (
                                                                    <line 
                                                                        x1={hoveredPoint.x} 
                                                                        y1="20" 
                                                                        x2={hoveredPoint.x} 
                                                                        y2="135" 
                                                                        stroke="#0284c7" 
                                                                        strokeWidth="1.2" 
                                                                        strokeDasharray="3,3" 
                                                                    />
                                                                )}

                                                                {/* Area under line */}
                                                                {footfallData.areaD && <path d={footfallData.areaD} fill="url(#chartGradient)" />}
                                                                
                                                                {/* Smooth Curve Line */}
                                                                {footfallData.pathD && <path d={footfallData.pathD} fill="none" stroke="#0284c7" strokeWidth="2.2" />}
                                                                
                                                                {/* Circles and Data points */}
                                                                {footfallData.points.filter((_, idx) => idx % 3 === 0).map((p, idx) => (
                                                                    <g key={idx}>
                                                                        <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                                                                        <text x={p.x} y="152" fontSize="7.5" fill="#64748b" textAnchor="middle">
                                                                            {p.slot === 0 ? "12 AM" : p.slot === 12 ? "12 PM" : `${p.slot}`}
                                                                        </text>
                                                                    </g>
                                                                ))}

                                                                {/* Hover Glow Highlight */}
                                                                {hoveredPoint && (
                                                                    <g>
                                                                        <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="8" fill="#0284c7" opacity="0.3" />
                                                                        <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="#0284c7" />
                                                                    </g>
                                                                )}

                                                                {/* Transparent hover targets */}
                                                                {footfallData.points.map((p, idx) => (
                                                                    <circle
                                                                        key={`target-${idx}`}
                                                                        cx={p.x}
                                                                        cy={p.y}
                                                                        r="10"
                                                                        fill="transparent"
                                                                        style={{ cursor: "pointer" }}
                                                                        onMouseEnter={() => setHoveredPoint(p)}
                                                                        onMouseLeave={() => setHoveredPoint(null)}
                                                                    />
                                                                ))}
                                                            </svg>

                                                            {/* Interactive Floating Tooltip */}
                                                            {hoveredPoint && (
                                                                <div style={{
                                                                    position: "absolute",
                                                                    left: `${(hoveredPoint.x / 350) * 100}%`,
                                                                    top: `${hoveredPoint.y - 52}px`,
                                                                    transform: "translateX(-50%)",
                                                                    backgroundColor: "#1e293b",
                                                                    border: "1px solid #cbd5e1",
                                                                    color: "#ffffff",
                                                                    padding: "6px 10px",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.7rem",
                                                                    pointerEvents: "none",
                                                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                                                                    zIndex: 10,
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    gap: "2px",
                                                                    whiteSpace: "nowrap"
                                                                }}>
                                                                    <span style={{ fontWeight: 700, color: "#38bdf8" }}>
                                                                        {formatSlotLabel(hoveredPoint.slot)}
                                                                    </span>
                                                                    <span style={{ fontWeight: 600 }}>
                                                                        Patients: <strong style={{ color: "#34d399" }}>{hoveredPoint.total}</strong>
                                                                    </span>
                                                                    {hoveredPoint.wait !== undefined && (
                                                                        <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                                                                            Avg Wait: {hoveredPoint.wait} mins
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted" style={{ padding: "40px 0", textAlign: "center" }}>No hourly patient traffic logged.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bar Chart: Medicine Inventory Safety Levels */}
                                        <div className="chart-card card">
                                            <h4 className="chart-card-title">
                                                <Archive size={18} style={{ color: "#f59e0b" }} />
                                                Medicine Safety Stock Safety Level
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
                                                {stockStats && stockStats.total > 0 ? (
                                                    <>
                                                        <div className="safety-bar-wrapper">
                                                            <div className="stacked-bar-container">
                                                                {stockStats.outPct > 0 && <div className="stacked-bar-segment stock-out" style={{ width: `${stockStats.outPct}%` }} title="Stock Out">{stockStats.outPct}%</div>}
                                                                {stockStats.lowPct > 0 && <div className="stacked-bar-segment low-stock" style={{ width: `${stockStats.lowPct}%` }} title="Low Stock">{stockStats.lowPct}%</div>}
                                                                {stockStats.normalPct > 0 && <div className="stacked-bar-segment normal" style={{ width: `${stockStats.normalPct}%` }} title="Sufficient">{stockStats.normalPct}%</div>}
                                                            </div>
                                                            <div className="stock-stats-breakdown">
                                                                <div className="stock-stat-box out">
                                                                    <div className="stock-box-value">{stockStats.out}</div>
                                                                    <div className="stock-box-label">Stock Out</div>
                                                                </div>
                                                                <div className="stock-stat-box low">
                                                                    <div className="stock-box-value">{stockStats.low}</div>
                                                                    <div className="stock-box-label">Low Stock</div>
                                                                </div>
                                                                <div className="stock-stat-box normal">
                                                                    <div className="stock-box-value">{stockStats.normal}</div>
                                                                    <div className="stock-box-label">Sufficient</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-muted" style={{ padding: "20px", textAlign: "center" }}>No stock items found.</div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "centres" && (
                        <div className="tab-pane">
                            <CentresTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "doctors" && (
                        <div className="tab-pane">
                            <DoctorsTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "medicines" && (
                        <div className="tab-pane">
                            <MedicinesTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "beds" && (
                        <div className="tab-pane">
                            <BedsTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "equipment" && (
                        <div className="tab-pane">
                            <EquipmentTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "tests" && (
                        <div className="tab-pane">
                            <TestsTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "footfall" && (
                        <div className="tab-pane">
                            <FootfallTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "alerts" && user.role === "DistrictAdmin" && (
                        <div className="tab-pane">
                            <AlertsTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "inventory" && (
                        <div className="tab-pane">
                            <InventoryTab token={token} user={user} />
                        </div>
                    )}

                    {activeTab === "ai-engine" && user.role === "DistrictAdmin" && (
                        <div className="tab-pane">
                            <AIRecommendationsTab token={token} user={user} />
                        </div>
                    )}

                    {/* Direct Edit tab rendering */}
                    {activeTab === "direct-edit" && user.role !== "DistrictAdmin" && user.role !== "Citizen" && (
                        <div className="tab-pane">
                            <DirectEditView token={token} user={user} userCentreName={userCentreName} />
                        </div>
                    )}
                    {/* Audit Logs tab rendering */}
                    {activeTab === "audit-logs" && user.role === "DistrictAdmin" && (
                        <div className="tab-pane">
                            <AuditLogsTab token={token} />
                        </div>
                    )}
                </main>
            </div>
            {/* Citizen Name Customization Modal */}
            {user.role === "Citizen" && !citizenName && (
                <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ maxWidth: "400px", width: "90%", padding: "30px", border: "1px solid #cbd5e1", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
                        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.4rem", color: "#0f172a" }}>Welcome to Smart Health</h3>
                        <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "0.9rem" }}>Please enter your name to customize your dashboard experience:</p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const val = e.target.elements.citizenInputName.value.trim();
                            if (val) {
                                setCitizenName(val);
                                localStorage.setItem("citizen_name", val);
                            }
                        }}>
                            <input 
                                type="text" 
                                name="citizenInputName"
                                className="form-control" 
                                placeholder="Your Name (e.g. Rahul Sharma)" 
                                required 
                                autoFocus
                                style={{ marginBottom: "20px", padding: "10px", fontSize: "1rem" }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px", fontSize: "1rem", fontWeight: 600 }}>
                                Save and Enter
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
