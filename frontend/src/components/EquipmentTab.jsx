import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, AlertCircle, Wrench, ShieldAlert } from "lucide-react";
import "./InventoryTab.css"; // Reuse inventory list styles

const EquipmentTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager" || user?.role === "Pharmacist";
    const [equipmentList, setEquipmentList] = useState([]);
    const [centres, setCentres] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
    const [expandedCentres, setExpandedCentres] = useState({});

    const effectiveFilterCentreId = filterCentreId !== undefined ? filterCentreId : (user?.role !== "DistrictAdmin" ? user?.health_centre_id : null);

    // Filters
    const filteredEquipment = useMemo(() => {
        return equipmentList.filter((item) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                item.equipment_name.toLowerCase().includes(query) ||
                item.health_centre_name.toLowerCase().includes(query) ||
                item.serial_no.toLowerCase().includes(query)
            );
            const matchesFilter = selectedStatusFilter === "all" || item.status === selectedStatusFilter;
            const matchesDirectEdit = !effectiveFilterCentreId || Number(item.health_centre_id) === Number(effectiveFilterCentreId);
            return matchesSearch && matchesFilter && matchesDirectEdit;
        });
    }, [equipmentList, searchQuery, selectedStatusFilter, effectiveFilterCentreId]);

    const equipmentByCentre = useMemo(() => {
        const groups = {};
        filteredEquipment.forEach(item => {
            const cName = item.health_centre_name || "Unassigned";
            if (!groups[cName]) {
                groups[cName] = [];
            }
            groups[cName].push(item);
        });
        return groups;
    }, [filteredEquipment]);

    const isSearchingOrFiltering = searchQuery.trim() !== "" || selectedStatusFilter !== "all";

    const toggleCentreExpand = (cName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [cName]: !prev[cName]
        }));
    };

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");

    // Form inputs
    const [healthCentreId, setHealthCentreId] = useState(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
    const [equipmentId, setEquipmentId] = useState("");
    const [serialNo, setSerialNo] = useState("");
    const [status, setStatus] = useState("Operational");
    const [lastInspectedAt, setLastInspectedAt] = useState("");
    const [notes, setNotes] = useState("");

    const fetchEquipment = async () => {
        try {
            const response = await fetch("http://localhost:5000/equipment", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch equipment");
            setEquipmentList(data);
            setError("");
        } catch (err) {
            console.error("Fetch equipment error:", err);
            setError(err.message);
        }
    };

    const fetchCentres = async () => {
        try {
            const response = await fetch("http://localhost:5000/centres", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch centres list");
            setCentres(data);
        } catch (err) {
            console.error("Fetch centres error in EquipmentTab:", err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await fetch("http://localhost:5000/equipment/catalog", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch equipment catalog");
            setCatalog(data);
        } catch (err) {
            console.error("Fetch catalog error in EquipmentTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchEquipment(), fetchCentres(), fetchCatalog()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError("");
        setHealthCentreId(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
        setEquipmentId("");
        setSerialNo("");
        setStatus("Operational");
        setLastInspectedAt("");
        setNotes("");
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setHealthCentreId(item.health_centre_id);
        setEquipmentId(item.equipment_id);
        setSerialNo(item.serial_no);
        setStatus(item.status);
        if (item.last_inspected_at) {
            setLastInspectedAt(new Date(item.last_inspected_at).toISOString().split("T")[0]);
        } else {
            setLastInspectedAt("");
        }
        setNotes(item.notes || "");
        setFormError("");
        setShowForm(true);
    };

    const handleDeleteClick = async (id, eqName, centreName) => {
        if (!window.confirm(`Are you sure you want to remove the ${eqName} (S/N: ${serialNo}) from ${centreName}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/equipment/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete equipment record");
            }

            fetchEquipment();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const payload = {
            health_centre_id: parseInt(healthCentreId),
            equipment_id: parseInt(equipmentId),
            serial_no: serialNo.trim(),
            status,
            last_inspected_at: lastInspectedAt ? new Date(lastInspectedAt).toISOString() : null,
            notes: notes.trim() || null
        };

        const url = editingId 
            ? `http://localhost:5000/equipment/${editingId}`
            : "http://localhost:5000/equipment";
        
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
                throw new Error(data.message || "Failed to save equipment details");
            }

            resetForm();
            fetchEquipment();
        } catch (err) {
            setFormError(err.message);
        }
    };

    // filteredEquipment is memoized at the top of the component

    const getStatusLabel = (statusVal) => {
        switch (statusVal) {
            case "Operational":
                return { label: "Operational", className: "status-available" };
            case "NeedsMaintenance":
                return { label: "Needs Maintenance", className: "status-maintenance" };
            case "Broken":
                return { label: "Broken", className: "status-occupied" };
            case "OutofService":
                return { label: "Out of Service", className: "status-occupied" };
            default:
                return { label: statusVal, className: "status-maintenance" };
        }
    };

    return (
        <div className="inventory-tab-container">
            <div className="tab-header">
                <h2>Facility Equipments Registry</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={openAddForm}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Equipment
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Equipment Details" : "Register New Equipment"}</h3>
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
                                        disabled={editingId !== null || user?.role !== "DistrictAdmin"}
                                    >
                                        <option value="">-- Select Center --</option>
                                        {centres.filter(c => !effectiveFilterCentreId || Number(c.id) === Number(effectiveFilterCentreId)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="equipment">Equipment Name *</label>
                                    <select
                                        id="equipment"
                                        className="form-control"
                                        value={equipmentId}
                                        onChange={(e) => setEquipmentId(e.target.value)}
                                        required
                                        disabled={editingId !== null}
                                    >
                                        <option value="">-- Select Equipment Type --</option>
                                        {catalog.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} ({e.criticality} Priority)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="serialNo">Serial Number *</label>
                                    <input
                                        type="text"
                                        id="serialNo"
                                        className="form-control"
                                        value={serialNo}
                                        onChange={(e) => setSerialNo(e.target.value)}
                                        placeholder="Manufacturer Unique ID"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="status">Operational Status *</label>
                                    <select
                                        id="status"
                                        className="form-control"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        required
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="NeedsMaintenance">Needs Maintenance</option>
                                        <option value="Broken">Broken</option>
                                        <option value="OutofService">Out of Service</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastInspected">Last Inspected Date</label>
                                    <input
                                        type="date"
                                        id="lastInspected"
                                        className="form-control"
                                        value={lastInspectedAt}
                                        onChange={(e) => setLastInspectedAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="notes">Notes / Remarks</label>
                                <textarea
                                    id="notes"
                                    className="form-control"
                                    rows="2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Incident reports, maintenance history logs, or placement details..."
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Register Equipment"}
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
                        placeholder="Search by facility, equipment type, priority, or serial number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Operational">Operational</option>
                        <option value="NeedsMaintenance">Needs Maintenance</option>
                        <option value="Broken">Broken</option>
                        <option value="OutofService">Out of Service</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading equipment records...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading equipment: {error}</p>
                </div>
            ) : filteredEquipment.length === 0 ? (
                <div className="empty-state card">
                    <p>No equipment records found matching your query.</p>
                </div>
            ) : (isSearchingOrFiltering || effectiveFilterCentreId) ? (
                // Full flat list when searching/filtering
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Health Centre</th>
                                <th>Equipment Name</th>
                                <th>Serial Number</th>
                                <th>Priority Severity</th>
                                <th>Operational Status</th>
                                <th>Last Inspected</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.map((item) => {
                                const statusObj = getStatusLabel(item.status);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.health_centre_name}</strong>
                                        </td>
                                        <td>{item.equipment_name}</td>
                                        <td><code>{item.serial_no}</code></td>
                                        <td>
                                            <span className={`user-badge ${
                                                item.criticality === "Critical" || item.criticality === "High" ? "error-alert" : ""
                                            }`} style={{ margin: 0, padding: "2px 6px" }}>
                                                {item.criticality}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`stock-status-badge ${statusObj.className}`}>
                                                {item.status === "Broken" && <ShieldAlert size={12} style={{ marginRight: "3px" }} />}
                                                {item.status === "NeedsMaintenance" && <Wrench size={12} style={{ marginRight: "3px" }} />}
                                                {statusObj.label}
                                            </span>
                                        </td>
                                        <td>
                                            {item.last_inspected_at 
                                                ? new Date(item.last_inspected_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                  }) 
                                                : "N/A"
                                            }
                                        </td>
                                        {isEditor && (
                                            <td className="table-actions">
                                                {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "Pharmacist") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                    <>
                                                        <button 
                                                            className="btn-icon btn-edit"
                                                            onClick={() => handleEditClick(item)}
                                                            title="Edit Equipment Details"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn-icon btn-delete"
                                                            onClick={() => handleDeleteClick(item.id, item.equipment_name, item.health_centre_name)}
                                                            title="Delete Equipment Record"
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                // Grouped by Health Centre accordion list view
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {Object.keys(equipmentByCentre).sort().map(cName => {
                        const centreItems = equipmentByCentre[cName];
                        const totalItems = centreItems.length;
                        const operationalItems = centreItems.filter(i => i.status === "Operational").length;
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
                                            {totalItems} Total Equipments
                                        </span>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#10b981", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                            {operationalItems} Operational
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
                                                    <th>Equipment Name</th>
                                                    <th>Serial Number</th>
                                                    <th>Priority Severity</th>
                                                    <th>Operational Status</th>
                                                    <th>Last Inspected</th>
                                                    {isEditor && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {centreItems.map((item) => {
                                                    const statusObj = getStatusLabel(item.status);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{item.equipment_name}</td>
                                                            <td><code>{item.serial_no}</code></td>
                                                            <td>
                                                                <span className={`user-badge ${
                                                                    item.criticality === "Critical" || item.criticality === "High" ? "error-alert" : ""
                                                                }`} style={{ margin: 0, padding: "2px 6px" }}>
                                                                    {item.criticality}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`stock-status-badge ${statusObj.className}`}>
                                                                    {item.status === "Broken" && <ShieldAlert size={12} style={{ marginRight: "3px" }} />}
                                                                    {item.status === "NeedsMaintenance" && <Wrench size={12} style={{ marginRight: "3px" }} />}
                                                                    {statusObj.label}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {item.last_inspected_at 
                                                                    ? new Date(item.last_inspected_at).toLocaleDateString("en-IN", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric"
                                                                      }) 
                                                                    : "N/A"
                                                                }
                                                            </td>
                                                            {isEditor && (
                                                                <td className="table-actions">
                                                                    {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "Pharmacist") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                                        <>
                                                                            <button 
                                                                                className="btn-icon btn-edit"
                                                                                onClick={() => handleEditClick(item)}
                                                                                title="Edit Equipment Details"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                            <button 
                                                                                className="btn-icon btn-delete"
                                                                                onClick={() => handleDeleteClick(item.id, item.equipment_name, item.health_centre_name)}
                                                                                title="Delete Equipment Record"
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
                                                    );
                                                })}
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

export default EquipmentTab;
