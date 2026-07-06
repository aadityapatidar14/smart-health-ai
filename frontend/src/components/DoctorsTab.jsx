import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, Activity, ChevronLeft, Award } from "lucide-react";
import "./DoctorsTab.css";

const DoctorsTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [doctors, setDoctors] = useState([]);
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSpecFilter, setSelectedSpecFilter] = useState("all");
    const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState("all");

    // Analytics States (DistrictAdmin only)
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Form visibility & state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // doctor_id
    const [formError, setFormError] = useState("");

    // Form inputs
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [healthCentreId, setHealthCentreId] = useState("");
    const [pincode, setPincode] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [licenseNo, setLicenseNo] = useState("");
    const [status, setStatus] = useState("Active");
    const [degree, setDegree] = useState("");

    const specializations = useMemo(() => {
        const specs = new Set();
        doctors.forEach(d => {
            if (d.specialization) specs.add(d.specialization.trim());
        });
        return Array.from(specs).sort();
    }, [doctors]);

    const fetchDoctors = async () => {
        try {
            const response = await fetch("http://localhost:5000/doctors", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch doctors");
            }

            setDoctors(data);
            setError("");
        } catch (err) {
            console.error("Fetch doctors error:", err);
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
            console.error("Fetch centres error in DoctorsTab:", err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoadingAnalytics(true);
            const response = await fetch("http://localhost:5000/doctors/analytics/weekly", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to load analytics");
            setAnalyticsData(data);
        } catch (err) {
            console.error("Analytics fetch error:", err);
            alert("Error loading weekly report: " + err.message);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchDoctors(), fetchCentres()]);
            setLoading(false);
        };

        loadAllData();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setEmail("");
        setHealthCentreId(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
        setPincode("");
        setSpecialization("");
        setLicenseNo("");
        setStatus("Active");
        setDegree("");
        setFormError("");
        setShowForm(false);
    };

    const handleEditClick = (doc) => {
        setEditingId(doc.doctor_id);
        setName(doc.name || "");
        setEmail(doc.email || "");
        setHealthCentreId(doc.health_centre_id || "");
        setPincode(doc.pincode || "");
        setSpecialization(doc.specialization || "");
        setLicenseNo(doc.license_no || "");
        setStatus(doc.status || "Active");
        setDegree(doc.degree || "");
        setFormError("");
        setShowForm(true);
    };

    const handleLiveStatusChange = async (doctorId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/doctors/${doctorId}/live-status`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh list locally
                fetchDoctors();
            } else {
                const data = await response.json();
                alert(data.message || "Failed to update attendance status");
            }
        } catch (err) {
            console.error("Attendance status change error:", err);
            alert("Error: " + err.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        // Basic front-end validation
        if (!name || !email || !specialization || !licenseNo) {
            setFormError("Name, Email, Specialization, and License No. are required.");
            return;
        }

        if (pincode && !/^[0-9]{6}$/.test(pincode)) {
            setFormError("Pincode must be exactly 6 digits.");
            return;
        }

        const payload = {
            name,
            email,
            health_centre_id: healthCentreId ? Number(healthCentreId) : null,
            pincode: pincode || null,
            specialization,
            degree,
            license_no: licenseNo,
            status,
        };

        const url = editingId 
            ? `http://localhost:5000/doctors/${editingId}`
            : "http://localhost:5000/doctors";
        
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
                throw new Error(data.message || "Failed to save doctor details");
            }

            await fetchDoctors();
            resetForm();
        } catch (err) {
            console.error("Save doctor error:", err);
            setFormError(err.message);
        }
    };

    const handleDeleteClick = async (id, doctorName) => {
        if (!window.confirm(`Are you sure you want to delete "${doctorName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/doctors/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete doctor");
            }

            await fetchDoctors();
        } catch (err) {
            console.error("Delete doctor error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const toggleAnalytics = () => {
        if (!showAnalytics) {
            fetchAnalytics();
        }
        setShowAnalytics(!showAnalytics);
    };

    // Filter list by query, specialization filter, and availability filter
    const filteredDoctors = doctors.filter(doc => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            doc.name.toLowerCase().includes(query) ||
            doc.email.toLowerCase().includes(query) ||
            doc.specialization.toLowerCase().includes(query) ||
            doc.license_no.toLowerCase().includes(query) ||
            (doc.degree && doc.degree.toLowerCase().includes(query)) ||
            (doc.health_centre_name && doc.health_centre_name.toLowerCase().includes(query))
        );
        const matchesSpec = selectedSpecFilter === "all" || doc.specialization === selectedSpecFilter;
        const matchesAvail = selectedAvailabilityFilter === "all" || (doc.live_status || "Not Marked") === selectedAvailabilityFilter;
        const matchesDirectEdit = !filterCentreId || Number(doc.health_centre_id) === Number(filterCentreId);
        return matchesSearch && matchesSpec && matchesAvail && matchesDirectEdit;
    });

    // Helper functions for styling attendance status badges
    const getAttendanceBgColor = (liveStatus) => {
        switch (liveStatus) {
            case "Present": return "#f0fdf4";
            case "Absent": return "#fef2f2";
            case "On Leave": return "#fffbeb";
            case "Emergency Callout": return "#f0f9ff";
            default: return "#f1f5f9";
        }
    };

    const getAttendanceTextColor = (liveStatus) => {
        switch (liveStatus) {
            case "Present": return "#166534";
            case "Absent": return "#991b1b";
            case "On Leave": return "#92400e";
            case "Emergency Callout": return "#075985";
            default: return "#475569";
        }
    };

    if (showAnalytics && user?.role === "DistrictAdmin") {
        return (
            <div className="doctors-tab-container">
                <div className="tab-header">
                    <button className="btn btn-secondary" onClick={toggleAnalytics} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ChevronLeft size={16} />
                        Back to Directory
                    </button>
                    <h2>Weekly Attendance Analytics</h2>
                </div>

                {loadingAnalytics || !analyticsData ? (
                    <div className="loading-state">
                        <p>Generating weekly attendance reports...</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "1.5rem" }}>
                        
                        {/* Summary Metrics Cards */}
                        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                            <div className="stat-card card">
                                <div className="stat-info">
                                    <span className="stat-label">Overall Attendance Rate</span>
                                    <span className="stat-value" style={{ color: "#10b981" }}>{analyticsData.summary.attendance_rate}%</span>
                                </div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-info">
                                    <span className="stat-label">Total Logs (Past 7 Days)</span>
                                    <span className="stat-value">{analyticsData.summary.total_records}</span>
                                </div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-info">
                                    <span className="stat-label">Present Logs</span>
                                    <span className="stat-value" style={{ color: "#166534" }}>{analyticsData.summary.present_count}</span>
                                </div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-info">
                                    <span className="stat-label">Absences / Leaves</span>
                                    <span className="stat-value" style={{ color: "#b45309" }}>{analyticsData.summary.absent_count} / {analyticsData.summary.leave_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart and Table Section */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                            
                            {/* Trend Line Chart */}
                            <div className="chart-card card" style={{ padding: "1.5rem" }}>
                                <h4 className="chart-card-title">
                                    <Award size={18} style={{ color: "#10b981" }} />
                                    Daily Attendance Rate Trend (Past 7 Days)
                                </h4>
                                <div style={{ minHeight: "150px", marginTop: "1rem" }}>
                                    {analyticsData.trend && analyticsData.trend.length > 0 ? (
                                        <svg width="100%" height="150" viewBox="0 0 350 150" preserveAspectRatio="none">
                                            {/* Grid lines */}
                                            <line x1="30" y1="30" x2="330" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="30" y1="80" x2="330" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="30" y1="130" x2="330" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
                                            
                                            {/* Draw trend path */}
                                            {(() => {
                                                const points = analyticsData.trend.map((t, idx) => {
                                                    const x = 30 + (idx * (300 / Math.max(analyticsData.trend.length - 1, 1)));
                                                    const y = 130 - (Number(t.rate) * (100 / 100)); // scale 0-100% to 0-100 height
                                                    return { x, y, date: t.date, rate: t.rate };
                                                });
                                                const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
                                                return (
                                                    <>
                                                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />
                                                        {points.map((p, idx) => (
                                                            <g key={idx}>
                                                                <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                                                                <text x={p.x} y="145" fontSize="7.5" fill="#64748b" textAnchor="middle">
                                                                    {p.date.split("-").slice(1).join("/")}
                                                                </text>
                                                                <text x={p.x} y={p.y - 8} fontSize="7.5" fill="#1e293b" fontWeight="700" textAnchor="middle">
                                                                    {p.rate}%
                                                                </text>
                                                            </g>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    ) : (
                                        <div className="text-muted" style={{ padding: "40px 0", textAlign: "center" }}>No trend logging logs.</div>
                                    )}
                                </div>
                            </div>

                            {/* Table Breakdown by Centre */}
                            <div className="chart-card card" style={{ padding: "1.5rem" }}>
                                <h4 className="chart-card-title">
                                    <Activity size={18} style={{ color: "#3b82f6" }} />
                                    Workplace Performance Metrics
                                </h4>
                                <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto", marginTop: "1rem" }}>
                                    <table className="centres-table" style={{ fontSize: "0.85rem" }}>
                                        <thead>
                                            <tr>
                                                <th>Health Centre</th>
                                                <th>Present</th>
                                                <th>Leave</th>
                                                <th>Absent</th>
                                                <th>Rate (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.byCentre.map(centre => (
                                                <tr key={centre.health_centre_id}>
                                                    <td><strong>{centre.health_centre_name}</strong></td>
                                                    <td>{centre.present_count}</td>
                                                    <td>{centre.leave_count}</td>
                                                    <td>{centre.absent_count}</td>
                                                    <td>
                                                        <span style={{ fontWeight: 700, color: centre.attendance_rate >= 80 ? "#10b981" : "#f59e0b" }}>
                                                            {centre.attendance_rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="doctors-tab-container">
            <div className="tab-header">
                <h2>Doctors Directory</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    {user?.role === "DistrictAdmin" && (
                        <button className="btn btn-secondary" onClick={toggleAnalytics} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Activity size={18} />
                            Weekly Analytics
                        </button>
                    )}
                    {!showForm && isEditor && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                            Add Doctor
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Doctor Credentials" : "Register New Doctor"}</h3>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && <div className="error-alert">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="docName">Full Name *</label>
                                    <input
                                        type="text"
                                        id="docName"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Dr. Vijay Patel"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="docEmail">Email Address *</label>
                                    <input
                                        type="email"
                                        id="docEmail"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. vijay@smarthealth.gov.in"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="specialization">Specialization *</label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        className="form-control"
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        placeholder="e.g. Pediatrics, General Medicine"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="degree">Degree *</label>
                                    <input
                                        type="text"
                                        id="degree"
                                        className="form-control"
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        placeholder="e.g. MBBS, MD, MS"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="licenseNo">Medical License No. *</label>
                                    <input
                                        type="text"
                                        id="licenseNo"
                                        className="form-control"
                                        value={licenseNo}
                                        onChange={(e) => setLicenseNo(e.target.value)}
                                        placeholder="e.g. MP-12345"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="healthCentre">Assigned Workplace</label>
                                    <select
                                        id="healthCentre"
                                        className="form-control"
                                        value={healthCentreId}
                                        onChange={(e) => setHealthCentreId(e.target.value)}
                                        disabled={user?.role === "CenterManager"}
                                    >
                                        <option value="">-- No Assigned Center --</option>
                                        {centres.filter(c => !filterCentreId || Number(c.id) === Number(filterCentreId)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="docPincode">Pincode</label>
                                    <input
                                        type="text"
                                        id="docPincode"
                                        className="form-control"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        placeholder="6-digit postal code"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="docStatus">Status</label>
                                    <select
                                        id="docStatus"
                                        className="form-control"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Register Doctor"}
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
                        placeholder="Search by name, specialty, license, or workplace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper" style={{ display: "flex", gap: "10px" }}>
                    <select
                        className="form-control filter-select"
                        value={selectedSpecFilter}
                        onChange={(e) => setSelectedSpecFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Specializations</option>
                        {specializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                    <select
                        className="form-control filter-select"
                        value={selectedAvailabilityFilter}
                        onChange={(e) => setSelectedAvailabilityFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Availability</option>
                        <option value="Not Marked">Not Marked</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Emergency Callout">Emergency Callout</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading doctors database...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading doctors: {error}</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="empty-state card">
                    <p>No doctors found matching your query.</p>
                </div>
            ) : (
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>License No</th>
                                <th>Specialization</th>
                                <th>Assigned Centre</th>
                                <th>Live Attendance</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDoctors.map((doc) => {
                                // Check if user is CenterManager and doctor belongs to their centre
                                const isAssignedManager = user?.role === "CenterManager" && Number(doc.health_centre_id) === Number(user.health_centre_id);

                                return (
                                    <tr key={doc.doctor_id}>
                                        <td>
                                            <strong>{doc.name}</strong>
                                            {doc.degree && (
                                                <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.85rem", marginLeft: "6px" }}>
                                                    ({doc.degree})
                                                </span>
                                            )}
                                        </td>
                                        <td>{doc.email}</td>
                                        <td>
                                            <code className="license-code">{doc.license_no}</code>
                                        </td>
                                        <td>{doc.specialization}</td>
                                        <td>
                                            {doc.health_centre_name ? (
                                                <span>{doc.health_centre_name}</span>
                                            ) : (
                                                <span className="text-muted">Unassigned</span>
                                            )}
                                        </td>
                                        
                                        {/* Doctor live availability column */}
                                        <td>
                                            {isAssignedManager ? (
                                                <select
                                                    value={doc.live_status || "Not Marked"}
                                                    onChange={(e) => handleLiveStatusChange(doc.doctor_id, e.target.value)}
                                                    className="form-control"
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        backgroundColor: getAttendanceBgColor(doc.live_status),
                                                        color: getAttendanceTextColor(doc.live_status),
                                                        border: "1px solid #cbd5e1",
                                                        cursor: "pointer",
                                                        outline: "none"
                                                    }}
                                                >
                                                    <option value="Not Marked">Not Marked</option>
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                    <option value="On Leave">On Leave</option>
                                                    <option value="Emergency Callout">Emergency Callout</option>
                                                </select>
                                            ) : (
                                                <span 
                                                    className="attendance-badge"
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        backgroundColor: getAttendanceBgColor(doc.live_status),
                                                        color: getAttendanceTextColor(doc.live_status),
                                                    }}
                                                >
                                                    {doc.live_status || "Not Marked"}
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <span className={`status-badge ${doc.status}`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        {isEditor && (
                                            <td className="table-actions">
                                                {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(doc.health_centre_id) === Number(user.health_centre_id))) ? (
                                                    <>
                                                        <button 
                                                            className="btn-icon btn-edit"
                                                            onClick={() => handleEditClick(doc)}
                                                            title="Edit Doctor"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        {user?.role === "DistrictAdmin" && (
                                                            <button 
                                                                className="btn-icon btn-delete"
                                                                onClick={() => handleDeleteClick(doc.doctor_id, doc.name)}
                                                                title="Delete Doctor"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>ReadOnly</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DoctorsTab;
