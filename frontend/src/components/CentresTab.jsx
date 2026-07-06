import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import "./CentresTab.css";

const CentresTab = ({ token, user }) => {
    const canModify = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");

    // Form visibility & state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");

    // Form inputs
    const [name, setName] = useState("");
    const [type, setType] = useState("PHC");
    const [districtId, setDistrictId] = useState(1); // Default to Indore District ID 1
    const [address, setAddress] = useState("");
    const [pincode, setPincode] = useState("");
    const [contactNo, setContactNo] = useState("");

    const fetchCentres = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/centres", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch health centres");
            }

            setCentres(data);
            setError("");
        } catch (err) {
            console.error("Fetch centres error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCentres();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setType("PHC");
        setDistrictId(1);
        setAddress("");
        setPincode("");
        setContactNo("");
        setFormError("");
        setShowForm(false);
    };

    const handleEditClick = (centre) => {
        setEditingId(centre.id);
        setName(centre.name || "");
        setType(centre.type || "PHC");
        setDistrictId(centre.district_id || 1);
        setAddress(centre.address || "");
        setPincode(centre.pincode || "");
        setContactNo(centre.contact_no || "");
        setFormError("");
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        // Simple frontend validation checks
        if (!name || !type) {
            setFormError("Name and Type are required.");
            return;
        }

        if (pincode && !/^[0-9]{6}$/.test(pincode)) {
            setFormError("Pincode must be exactly 6 digits.");
            return;
        }

        const payload = {
            name,
            type,
            district_id: Number(districtId),
            address: address || null,
            pincode: pincode || null,
            contact_no: contactNo || null,
        };

        const url = editingId 
            ? `http://localhost:5000/centres/${editingId}`
            : "http://localhost:5000/centres";
        
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
                throw new Error(data.message || "Failed to save health centre");
            }

            // Success: reload centres and close form
            await fetchCentres();
            resetForm();
        } catch (err) {
            console.error("Save error:", err);
            setFormError(err.message);
        }
    };

    const handleDeleteClick = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/centres/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete health centre");
            }

            // Success: reload centres
            await fetchCentres();
        } catch (err) {
            console.error("Delete error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    // Filter centres based on search query and type filter
    const filteredCentres = centres.filter(centre => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            centre.name.toLowerCase().includes(query) ||
            (centre.pincode && centre.pincode.includes(query)) ||
            centre.type.toLowerCase().includes(query)
        );
        const matchesFilter = selectedTypeFilter === "all" || centre.type === selectedTypeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="centres-tab-container">
            <div className="tab-header">
                <h2>Health Centres Management</h2>
                {!showForm && user?.role === "DistrictAdmin" && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Centre
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Health Centre" : "Add New Health Centre"}</h3>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && <div className="error-alert">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="centreName">Centre Name *</label>
                                    <input
                                        type="text"
                                        id="centreName"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. PHC Vijay Nagar"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="centreType">Type *</label>
                                    <select
                                        id="centreType"
                                        className="form-control"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        required
                                    >
                                        <option value="PHC">PHC (Primary Health Centre)</option>
                                        <option value="CHC">CHC (Community Health Centre)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="pincode">Pincode</label>
                                    <input
                                        type="text"
                                        id="pincode"
                                        className="form-control"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        placeholder="e.g. 452010"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contactNo">Contact No.</label>
                                    <input
                                        type="text"
                                        id="contactNo"
                                        className="form-control"
                                        value={contactNo}
                                        onChange={(e) => setContactNo(e.target.value)}
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>

                                
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    className="form-control"
                                    rows="2"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Full street address..."
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Create Centre"}
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
                        placeholder="Search by name, pincode, or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Types</option>
                        <option value="PHC">PHC (Primary Health Centre)</option>
                        <option value="CHC">CHC (Community Health Centre)</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading health centres...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading health centres: {error}</p>
                </div>
            ) : filteredCentres.length === 0 ? (
                <div className="empty-state card">
                    <p>No health centres found matching your query.</p>
                </div>
            ) : (
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Address</th>
                                <th>Pincode</th>
                                <th>Contact No</th>
                                {canModify && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCentres.map((centre) => (
                                <tr key={centre.id}>
                                    <td>
                                        <strong>{centre.name}</strong>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${centre.type}`}>
                                            {centre.type}
                                        </span>
                                    </td>
                                    <td>{centre.address || <span className="text-muted">N/A</span>}</td>
                                    <td>{centre.pincode || <span className="text-muted">N/A</span>}</td>
                                    <td>{centre.contact_no || <span className="text-muted">N/A</span>}</td>
                                    {canModify && (
                                         <td className="table-actions">
                                             {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(centre.id) === Number(user.health_centre_id))) && (
                                                 <button 
                                                     className="btn-icon btn-edit"
                                                     onClick={() => handleEditClick(centre)}
                                                     title="Edit Center"
                                                 >
                                                     <Edit size={16} />
                                                 </button>
                                             )}
                                             {user?.role === "DistrictAdmin" && (
                                                 <button 
                                                     className="btn-icon btn-delete"
                                                     onClick={() => handleDeleteClick(centre.id, centre.name)}
                                                     title="Delete Center"
                                                 >
                                                     <Trash2 size={16} />
                                                 </button>
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

export default CentresTab;
