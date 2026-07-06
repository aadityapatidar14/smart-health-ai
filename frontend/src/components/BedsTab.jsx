import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import "./BedsTab.css";

const BedsTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [beds, setBeds] = useState([]);
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
    const [expandedCentres, setExpandedCentres] = useState({});

    // Filter list by query, type filter, and status filter
    const filteredBeds = useMemo(() => {
        return beds.filter(bed => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                bed.bed_number.toLowerCase().includes(query) ||
                bed.ward_name.toLowerCase().includes(query) ||
                bed.bed_type.toLowerCase().includes(query) ||
                bed.status.toLowerCase().includes(query) ||
                (bed.health_centre_name && bed.health_centre_name.toLowerCase().includes(query))
            );
            const matchesType = selectedTypeFilter === "all" || bed.bed_type === selectedTypeFilter;
            const matchesStatus = selectedStatusFilter === "all" || bed.status === selectedStatusFilter;
            const matchesDirectEdit = !filterCentreId || Number(bed.health_centre_id) === Number(filterCentreId);
            return matchesSearch && matchesType && matchesStatus && matchesDirectEdit;
        });
    }, [beds, searchQuery, selectedTypeFilter, selectedStatusFilter, filterCentreId]);

    const bedsByCentre = useMemo(() => {
        const groups = {};
        filteredBeds.forEach(bed => {
            const cName = bed.health_centre_name || "Unassigned";
            if (!groups[cName]) {
                groups[cName] = [];
            }
            groups[cName].push(bed);
        });
        return groups;
    }, [filteredBeds]);

    const isSearchingOrFiltering = searchQuery.trim() !== "" || selectedTypeFilter !== "all" || selectedStatusFilter !== "all";

    const toggleCentreExpand = (cName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [cName]: !prev[cName]
        }));
    };

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // bed id
    const [formError, setFormError] = useState("");

    // Inputs
    const [healthCentreId, setHealthCentreId] = useState(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
    const [wardName, setWardName] = useState("");
    const [bedType, setBedType] = useState("General");
    const [status, setStatus] = useState("Available");
    const [bedNumber, setBedNumber] = useState("");

    const fetchBeds = async () => {
        try {
            const response = await fetch("http://localhost:5000/beds", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch beds");
            }

            setBeds(data);
            setError("");
        } catch (err) {
            console.error("Fetch beds error:", err);
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
            console.error("Fetch centres error in BedsTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchBeds(), fetchCentres()]);
            setLoading(false);
        };

        loadAllData();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setHealthCentreId(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
        setWardName("");
        setBedType("General");
        setStatus("Available");
        setBedNumber("");
        setFormError("");
        setShowForm(false);
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditClick = (bed) => {
        setEditingId(bed.id);
        setHealthCentreId(bed.health_centre_id || "");
        setWardName(bed.ward_name || "");
        setBedType(bed.bed_type || "General");
        setStatus(bed.status || "Available");
        setBedNumber(bed.bed_number || "");
        setFormError("");
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!healthCentreId || !wardName || !bedType || !status || !bedNumber) {
            setFormError("All fields are required.");
            return;
        }

        const payload = {
            health_centre_id: Number(healthCentreId),
            ward_name: wardName,
            bed_type: bedType,
            status,
            bed_number: bedNumber,
        };

        const url = editingId 
            ? `http://localhost:5000/beds/${editingId}`
            : "http://localhost:5000/beds";
        
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
                throw new Error(data.message || "Failed to save bed details");
            }

            await fetchBeds();
            resetForm();
        } catch (err) {
            console.error("Save bed error:", err);
            setFormError(err.message);
        }
    };

    const handleDeleteClick = async (id, bNumber, wName) => {
        if (!window.confirm(`Are you sure you want to delete "${bNumber}" in "${wName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/beds/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete bed");
            }

            await fetchBeds();
        } catch (err) {
            console.error("Delete bed error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="beds-tab-container">
            <div className="tab-header">
                <h2>Beds Inventory Management</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={openAddForm}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Bed
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Bed Details" : "Register New Bed"}</h3>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && <div className="error-alert">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="healthCentre">Health Centre *</label>
                                    <select
                                        id="healthCentre"
                                        className="form-control"
                                        value={healthCentreId}
                                        onChange={(e) => setHealthCentreId(e.target.value)}
                                        required
                                        disabled={user?.role === "CenterManager"}
                                    >
                                        <option value="">-- Select Center --</option>
                                        {centres.filter(c => !filterCentreId || Number(c.id) === Number(filterCentreId)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="wardName">Ward Name *</label>
                                    <input
                                        type="text"
                                        id="wardName"
                                        className="form-control"
                                        value={wardName}
                                        onChange={(e) => setWardName(e.target.value)}
                                        placeholder="e.g. Female General, ICU"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bedNumber">Bed Number / ID *</label>
                                    <input
                                        type="text"
                                        id="bedNumber"
                                        className="form-control"
                                        value={bedNumber}
                                        onChange={(e) => setBedNumber(e.target.value)}
                                        placeholder="e.g. ICU-05, BED-21"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bedType">Bed Category / Specialty *</label>
                                    <select
                                        id="bedType"
                                        className="form-control"
                                        value={bedType}
                                        onChange={(e) => setBedType(e.target.value)}
                                        required
                                    >
                                        <option value="General">General</option>
                                        <option value="ICU">ICU</option>
                                        <option value="Maternity">Maternity</option>
                                        <option value="Pediatric">Pediatric</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bedStatus">Occupancy Status *</label>
                                    <select
                                        id="bedStatus"
                                        className="form-control"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        required
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Occupied">Occupied</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Register Bed"}
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
                        placeholder="Search by center, ward, bed number, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper" style={{ display: "flex", gap: "10px" }}>
                    <select
                        className="form-control filter-select"
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "150px", cursor: "pointer" }}
                    >
                        <option value="all">All Bed Types</option>
                        <option value="General">General</option>
                        <option value="ICU">ICU</option>
                        <option value="Maternity">Maternity</option>
                        <option value="Pediatric">Pediatric</option>
                        <option value="Emergency">Emergency</option>
                    </select>
                    <select
                        className="form-control filter-select"
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "150px", cursor: "pointer" }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading beds database...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading beds: {error}</p>
                </div>
            ) : filteredBeds.length === 0 ? (
                <div className="empty-state card">
                    <p>No beds found matching your query.</p>
                </div>
            ) : isSearchingOrFiltering ? (
                // Full flat list when searching/filtering
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Health Centre</th>
                                <th>Ward Name</th>
                                <th>Bed Number</th>
                                <th>Bed Type</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBeds.map((bed) => (
                                <tr key={bed.id}>
                                    <td>
                                        <strong>{bed.health_centre_name}</strong>
                                    </td>
                                    <td>{bed.ward_name}</td>
                                    <td>
                                        <span className="bed-number-badge">{bed.bed_number}</span>
                                    </td>
                                    <td>{bed.bed_type}</td>
                                    <td>
                                        <span className={`status-badge ${bed.status}`}>
                                            {bed.status}
                                        </span>
                                    </td>
                                    {isEditor && (
                                        <td className="table-actions">
                                            {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(bed.health_centre_id) === Number(user.health_centre_id))) ? (
                                                <>
                                                    <button 
                                                        className="btn-icon btn-edit"
                                                        onClick={() => handleEditClick(bed)}
                                                        title="Edit Bed"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="btn-icon btn-delete"
                                                        onClick={() => handleDeleteClick(bed.id, bed.bed_number, bed.ward_name)}
                                                        title="Delete Bed"
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
            ) : (
                // Grouped by Health Centre accordion list view
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {Object.keys(bedsByCentre).sort().map(cName => {
                        const centreBeds = bedsByCentre[cName];
                        const totalBeds = centreBeds.length;
                        const availableBeds = centreBeds.filter(b => b.status === "Available").length;
                        const isExpanded = !!expandedCentres[cName];

                        return (
                            <div key={cName} className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #cbd5e1" }}>
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
                                            {totalBeds} Total Beds
                                        </span>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#10b981", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                            {availableBeds} Available
                                        </span>
                                    </div>
                                    <div style={{ color: "#64748b", fontWeight: "bold", fontSize: "1.2rem" }}>
                                        {isExpanded ? "−" : "+"}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div style={{ padding: "15px", backgroundColor: "#ffffff" }}>
                                        <table className="centres-table" style={{ margin: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th>Ward Name</th>
                                                    <th>Bed Number</th>
                                                    <th>Bed Type</th>
                                                    <th>Status</th>
                                                    {isEditor && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {centreBeds.map((bed) => (
                                                    <tr key={bed.id}>
                                                        <td>{bed.ward_name}</td>
                                                        <td>
                                                            <span className="bed-number-badge">{bed.bed_number}</span>
                                                        </td>
                                                        <td>{bed.bed_type}</td>
                                                        <td>
                                                            <span className={`status-badge ${bed.status}`}>
                                                                {bed.status}
                                                            </span>
                                                        </td>
                                                        {isEditor && (
                                                            <td className="table-actions">
                                                                {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(bed.health_centre_id) === Number(user.health_centre_id))) ? (
                                                                    <>
                                                                        <button 
                                                                            className="btn-icon btn-edit"
                                                                            onClick={() => handleEditClick(bed)}
                                                                            title="Edit Bed"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button 
                                                                            className="btn-icon btn-delete"
                                                                            onClick={() => handleDeleteClick(bed.id, bed.bed_number, bed.ward_name)}
                                                                            title="Delete Bed"
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
                    })}
                </div>
            )}
        </div>
    );
};

export default BedsTab;
