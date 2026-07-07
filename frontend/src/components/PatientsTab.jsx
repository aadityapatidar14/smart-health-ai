import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, Users, CheckCircle, Clock } from "lucide-react";
import "./PatientsTab.css";

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://smart-health-ai-v9cs.onrender.com";

const PatientsTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [patients, setPatients] = useState([]);
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
    const [selectedCentreFilter, setSelectedCentreFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedCentres, setExpandedCentres] = useState({});

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");

    // Inputs
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [location, setLocation] = useState("");
    const [admissionReason, setAdmissionReason] = useState("");
    const [status, setStatus] = useState("Admitted");
    const [healthCentreId, setHealthCentreId] = useState("");

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${API_URL}/patients`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch patients");
            }

            setPatients(data);
            setError("");
        } catch (err) {
            console.error("Fetch patients error:", err);
            setError(err.message);
        }
    };

    const fetchCentres = async () => {
        try {
            const response = await fetch(`${API_URL}/centres`, {
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
            console.error("Fetch centres error in PatientsTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchPatients(), fetchCentres()]);
            setLoading(false);
        };

        loadAllData();
    }, [token]);

    // Handle form opening
    const handleOpenCreate = () => {
        setEditingId(null);
        setName("");
        setPhoneNumber("");
        setLocation("");
        setAdmissionReason("");
        setStatus("Admitted");
        setHealthCentreId(user?.role === "CenterManager" ? String(user.health_centre_id) : (centres[0]?.id ? String(centres[0].id) : ""));
        setFormError("");
        setShowForm(true);
    };

    const handleOpenEdit = (patient) => {
        setEditingId(patient.id);
        setName(patient.name);
        setPhoneNumber(patient.phone_number);
        setLocation(patient.location || "");
        setAdmissionReason(patient.admission_reason);
        setStatus(patient.status);
        setHealthCentreId(String(patient.health_centre_id));
        setFormError("");
        setShowForm(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!name.trim() || !phoneNumber.trim() || !admissionReason.trim() || !healthCentreId) {
            setFormError("Please fill in all required fields.");
            return;
        }

        const payload = {
            name,
            phone_number: phoneNumber,
            location,
            admission_reason: admissionReason,
            status,
            health_centre_id: Number(healthCentreId)
        };

        const url = editingId ? `${API_URL}/patients/${editingId}` : `${API_URL}/patients`;
        const method = editingId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save patient details.");
            }

            setShowForm(false);
            fetchPatients();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this patient record?")) return;

        try {
            const response = await fetch(`${API_URL}/patients/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete patient record.");
            }

            fetchPatients();
        } catch (err) {
            alert(err.message);
        }
    };

    // Calculate lists
    const filteredPatients = useMemo(() => {
        return patients.filter(patient => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                patient.name.toLowerCase().includes(query) ||
                patient.phone_number.toLowerCase().includes(query) ||
                patient.admission_reason.toLowerCase().includes(query) ||
                (patient.location && patient.location.toLowerCase().includes(query)) ||
                (patient.health_centre_name && patient.health_centre_name.toLowerCase().includes(query))
            );

            const matchesStatus = selectedStatusFilter === "all" || patient.status === selectedStatusFilter;
            const matchesCentre = selectedCentreFilter === "all" || Number(patient.health_centre_id) === Number(selectedCentreFilter);
            const matchesDirectEdit = !filterCentreId || Number(patient.health_centre_id) === Number(filterCentreId);

            return matchesSearch && matchesStatus && matchesCentre && matchesDirectEdit;
        });
    }, [patients, searchQuery, selectedStatusFilter, selectedCentreFilter, filterCentreId]);

    // Accordion group calculations
    const patientsByCentre = useMemo(() => {
        const groups = {};
        filteredPatients.forEach(patient => {
            const cName = patient.health_centre_name || "Unassigned";
            if (!groups[cName]) {
                groups[cName] = [];
            }
            groups[cName].push(patient);
        });
        return groups;
    }, [filteredPatients]);

    const toggleCentreExpand = (cName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [cName]: !prev[cName]
        }));
    };

    const isSearchingOrFiltering = searchQuery.trim() !== "" || selectedStatusFilter !== "all" || selectedCentreFilter !== "all";

    // Statistics
    const stats = useMemo(() => {
        const total = filteredPatients.length;
        const admitted = filteredPatients.filter(p => p.status === "Admitted").length;
        const discharged = filteredPatients.filter(p => p.status === "Discharged").length;
        return { total, admitted, discharged };
    }, [filteredPatients]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return <div className="loading-state"><p>Loading admitted patients details...</p></div>;
    }

    return (
        <div className="patients-tab-container">
            <div className="tab-header">
                <h2>Admitted Patient Records</h2>
                {isEditor && (
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={16} /> Log New Admission
                    </button>
                )}
            </div>

            {error && <div className="error-alert">{error}</div>}

            {/* Metrics Row */}
            <div className="stats-grid">
                <div className="stat-card card no-click">
                    <div className="stat-icon-wrapper blue">
                        <Users size={20} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Logs</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                </div>
                <div className="stat-card card no-click">
                    <div className="stat-icon-wrapper orange">
                        <Clock size={20} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Active Admissions</span>
                        <span className="stat-value">{stats.admitted}</span>
                    </div>
                </div>
                <div className="stat-card card no-click">
                    <div className="stat-icon-wrapper green">
                        <CheckCircle size={20} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Discharged</span>
                        <span className="stat-value">{stats.discharged}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="list-controls" style={{ marginBottom: "1rem" }}>
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, hospital, or reason..."
                        className="form-control search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-wrapper" style={{ display: "flex", gap: "10px" }}>
                    <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="form-control filter-select"
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "150px", cursor: "pointer" }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Discharged">Discharged</option>
                        <option value="Transferred">Transferred</option>
                    </select>

                    {user?.role === "DistrictAdmin" && !filterCentreId && (
                        <select
                            value={selectedCentreFilter}
                            onChange={(e) => setSelectedCentreFilter(e.target.value)}
                            className="form-control filter-select"
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "150px", cursor: "pointer" }}
                        >
                            <option value="all">All Health Centres</option>
                            {centres.map(centre => (
                                <option key={centre.id} value={centre.id}>{centre.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Accordion Group List or Flat List */}
            {!isSearchingOrFiltering ? (
                // Grouped by Health Centre accordion list view
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {Object.keys(patientsByCentre).sort().map(cName => {
                        const centrePatients = patientsByCentre[cName];
                        const totalPatients = centrePatients.length;
                        const activePatients = centrePatients.filter(p => p.status === "Admitted").length;
                        const isExpanded = !!expandedCentres[cName];

                        return (
                            <div key={cName} className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <div 
                                    onClick={() => toggleCentreExpand(cName)}
                                    style={{ 
                                        padding: "16px 20px", 
                                        backgroundColor: "#f8fafc", 
                                        cursor: "pointer", 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center",
                                        borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                                        userSelect: "none"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>{cName}</h3>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#3b82f6", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                            {totalPatients} Total Logs
                                        </span>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#f59e0b", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                            {activePatients} Active
                                        </span>
                                    </div>
                                    <div style={{ color: "#64748b", fontWeight: "bold", fontSize: "1.2rem" }}>
                                        {isExpanded ? "−" : "+"}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div style={{ padding: "15px", backgroundColor: "#ffffff" }}>
                                        <div className="table-responsive" style={{ margin: 0 }}>
                                            <table className="centres-table" style={{ margin: 0 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Patient Name</th>
                                                        <th>Contact Info</th>
                                                        <th>Location / Address</th>
                                                        <th>Reason for Admission</th>
                                                        <th>Admission Date</th>
                                                        <th>Status</th>
                                                        {isEditor && <th>Actions</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {centrePatients.map((patient) => (
                                                        <tr key={patient.id}>
                                                            <td className="font-semibold">{patient.name}</td>
                                                            <td>{patient.phone_number}</td>
                                                            <td>{patient.location || <span className="text-muted">Not provided</span>}</td>
                                                            <td className="text-muted">{patient.admission_reason}</td>
                                                            <td>
                                                                <div className="date-time-cell">
                                                                    <span>{formatDate(patient.admission_date)}</span>
                                                                    {patient.status === "Discharged" && (
                                                                        <small className="text-success-muted block">Discharged: {formatDate(patient.discharge_date)}</small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${patient.status.toLowerCase()}`}>
                                                                    {patient.status}
                                                                </span>
                                                            </td>
                                                            {isEditor && (
                                                                <td className="table-actions">
                                                                    <button
                                                                        className="btn-icon btn-edit"
                                                                        title="Edit Details"
                                                                        onClick={() => handleOpenEdit(patient)}
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn-icon btn-delete"
                                                                        title="Delete Record"
                                                                        onClick={() => handleDelete(patient.id)}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Flat table list view when searching or filtering
                <div className="table-responsive card" style={{ padding: "0" }}>
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Contact Info</th>
                                <th>Location / Address</th>
                                <th>Health Facility</th>
                                <th>Reason for Admission</th>
                                <th>Admission Date</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={isEditor ? 8 : 7} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                                        No patient records found matching query.
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.id}>
                                        <td className="font-semibold">{patient.name}</td>
                                        <td>{patient.phone_number}</td>
                                        <td>{patient.location || <span className="text-muted">Not provided</span>}</td>
                                        <td>{patient.health_centre_name}</td>
                                        <td className="text-muted">{patient.admission_reason}</td>
                                        <td>
                                            <div className="date-time-cell">
                                                <span>{formatDate(patient.admission_date)}</span>
                                                {patient.status === "Discharged" && (
                                                    <small className="text-success-muted block">Discharged: {formatDate(patient.discharge_date)}</small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${patient.status.toLowerCase()}`}>
                                                {patient.status}
                                            </span>
                                        </td>
                                        {isEditor && (
                                            <td className="table-actions">
                                                <button
                                                    className="btn-icon btn-edit"
                                                    title="Edit Details"
                                                    onClick={() => handleOpenEdit(patient)}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    title="Delete Record"
                                                    onClick={() => handleDelete(patient.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal Overlay */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content form-card">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Patient Admission Details" : "Log New Patient Admission"}</h3>
                            <button className="btn-close" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {formError && <div className="error-alert mb-4">{formError}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label required-field">Patient Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rajesh Kumar"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label required-field">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9876543210"
                                        className="form-control"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location / Address</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Annapurna Area"
                                        className="form-control"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                {user?.role === "DistrictAdmin" ? (
                                    <div className="form-group">
                                        <label className="form-label required-field">Admitting Health Facility</label>
                                        <select
                                            value={healthCentreId}
                                            onChange={(e) => setHealthCentreId(e.target.value)}
                                            className="form-control"
                                            required
                                        >
                                            <option value="">Select Facility</option>
                                            {centres.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Admitting Health Facility</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={user?.health_centre_name || "Assigned Facility"}
                                            disabled
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label required-field">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="form-control"
                                        required
                                    >
                                        <option value="Admitted">Admitted</option>
                                        <option value="Discharged">Discharged</option>
                                        <option value="Transferred">Transferred</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label required-field">Reason for Admission</label>
                                <textarea
                                    placeholder="Enter clinical symptoms or reason for admission..."
                                    className="form-control"
                                    rows="3"
                                    value={admissionReason}
                                    onChange={(e) => setAdmissionReason(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Update Record" : "Register Patient"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsTab;
