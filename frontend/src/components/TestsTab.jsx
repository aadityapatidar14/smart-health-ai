import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, CheckCircle, XCircle } from "lucide-react";
import "./InventoryTab.css"; // Reuse inventory list styles

const TestsTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager" || user?.role === "LabTechnician";
    const [testsList, setTestsList] = useState([]);
    const [centres, setCentres] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
    const [expandedCentres, setExpandedCentres] = useState({});

    // Filters
    const filteredTests = useMemo(() => {
        return testsList.filter((item) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                item.test_name.toLowerCase().includes(query) ||
                item.health_centre_name.toLowerCase().includes(query) ||
                item.test_category.toLowerCase().includes(query)
            );
            const matchesFilter = selectedCategoryFilter === "all" || item.test_category === selectedCategoryFilter;
            const matchesDirectEdit = !filterCentreId || Number(item.health_centre_id) === Number(filterCentreId);
            return matchesSearch && matchesFilter && matchesDirectEdit;
        });
    }, [testsList, searchQuery, selectedCategoryFilter, filterCentreId]);

    const testsByCentre = useMemo(() => {
        const groups = {};
        filteredTests.forEach(item => {
            const cName = item.health_centre_name || "Unassigned";
            if (!groups[cName]) {
                groups[cName] = [];
            }
            groups[cName].push(item);
        });
        return groups;
    }, [filteredTests]);

    const isSearchingOrFiltering = searchQuery.trim() !== "" || selectedCategoryFilter !== "all";

    const toggleCentreExpand = (cName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [cName]: !prev[cName]
        }));
    };

    const testCategories = useMemo(() => {
        const cats = new Set();
        testsList.forEach(t => {
            if (t.test_category) cats.add(t.test_category.trim());
        });
        return Array.from(cats).sort();
    }, [testsList]);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");

    // Form inputs
    const [healthCentreId, setHealthCentreId] = useState(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
    const [testId, setTestId] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [dailyCapacity, setDailyCapacity] = useState("");
    const [statusNotes, setStatusNotes] = useState("");

    const fetchTests = async () => {
        try {
            const response = await fetch("http://localhost:5000/tests", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch diagnostic tests");
            setTestsList(data);
            setError("");
        } catch (err) {
            console.error("Fetch tests error:", err);
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
            console.error("Fetch centres error in TestsTab:", err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await fetch("http://localhost:5000/tests/catalog", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch tests catalog");
            setCatalog(data);
        } catch (err) {
            console.error("Fetch catalog error in TestsTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchTests(), fetchCentres(), fetchCatalog()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormError("");
        setHealthCentreId(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
        setTestId("");
        setIsAvailable(true);
        setDailyCapacity("100");
        setStatusNotes("");
        setShowForm(false);
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setHealthCentreId(item.health_centre_id);
        setTestId(item.test_id);
        setIsAvailable(item.is_available);
        setDailyCapacity(item.daily_capacity);
        setStatusNotes(item.status_notes || "");
        setFormError("");
        setShowForm(true);
    };

    const handleDeleteClick = async (id, testName, centreName) => {
        if (!window.confirm(`Are you sure you want to remove the diagnostic test '${testName}' from ${centreName}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/tests/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete test availability record");
            }

            fetchTests();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const payload = {
            health_centre_id: parseInt(healthCentreId),
            test_id: parseInt(testId),
            is_available: isAvailable,
            daily_capacity: parseInt(dailyCapacity) || 100,
            status_notes: statusNotes.trim() || null
        };

        const url = editingId 
            ? `http://localhost:5000/tests/${editingId}`
            : "http://localhost:5000/tests";
        
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
                throw new Error(data.message || "Failed to save diagnostic test details");
            }

            resetForm();
            fetchTests();
        } catch (err) {
            setFormError(err.message);
        }
    };

    // filteredTests is memoized at the top of the component

    return (
        <div className="inventory-tab-container">
            <div className="tab-header">
                <h2>Diagnostic Services Availability</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={openAddForm}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Diagnostic Test
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Test Availability Details" : "Register Diagnostic Service"}</h3>
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
                                        {centres.filter(c => !filterCentreId || Number(c.id) === Number(filterCentreId)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="test">Diagnostic Test Type *</label>
                                    <select
                                        id="test"
                                        className="form-control"
                                        value={testId}
                                        onChange={(e) => setTestId(e.target.value)}
                                        required
                                        disabled={editingId !== null}
                                    >
                                        <option value="">-- Select Test --</option>
                                        {catalog.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="isAvailable">Availability Status *</label>
                                    <select
                                        id="isAvailable"
                                        className="form-control"
                                        value={isAvailable ? "true" : "false"}
                                        onChange={(e) => setIsAvailable(e.target.value === "true")}
                                        required
                                    >
                                        <option value="true">Available (Active)</option>
                                        <option value="false">Unavailable (Suspended)</option>
                                    </select>
                                </div>

                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Register Service"}
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
                        placeholder="Search by health facility, test name, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "180px", cursor: "pointer" }}
                    >
                        <option value="all">All Categories</option>
                        {testCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading diagnostic test records...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading diagnostic tests: {error}</p>
                </div>
            ) : filteredTests.length === 0 ? (
                <div className="empty-state card">
                    <p>No test records found matching your query.</p>
                </div>
            ) : isSearchingOrFiltering ? (
                // Full flat list when searching/filtering
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Health Centre</th>
                                <th>Test Name</th>
                                <th>Category</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTests.map((item) => {
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.health_centre_name}</strong>
                                        </td>
                                        <td>{item.test_name}</td>
                                        <td>{item.test_category}</td>
                                        <td>
                                            <span className={`stock-status-badge ${
                                                item.is_available ? "status-available" : "status-occupied"
                                            }`}>
                                                {item.is_available ? (
                                                    <CheckCircle size={12} style={{ marginRight: "3px" }} />
                                                ) : (
                                                    <XCircle size={12} style={{ marginRight: "3px" }} />
                                                )}
                                                {item.is_available ? "Available" : "Unavailable"}
                                            </span>
                                        </td>
                                        {isEditor && (
                                            <td className="table-actions">
                                                {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "LabTechnician") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                    <>
                                                        <button 
                                                            className="btn-icon btn-edit"
                                                            onClick={() => handleEditClick(item)}
                                                            title="Edit Test Details"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn-icon btn-delete"
                                                            onClick={() => handleDeleteClick(item.id, item.test_name, item.health_centre_name)}
                                                            title="Delete Test Record"
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
                    {Object.keys(testsByCentre).sort().map(cName => {
                        const centreTests = testsByCentre[cName];
                        const totalTests = centreTests.length;
                        const availableTests = centreTests.filter(t => t.is_available).length;
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
                                            {totalTests} Registered Services
                                        </span>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#10b981", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                            {availableTests} Active
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
                                                    <th>Test Name</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    {isEditor && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {centreTests.map((item) => {
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{item.test_name}</td>
                                                            <td>{item.test_category}</td>
                                                            <td>
                                                                <span className={`stock-status-badge ${
                                                                    item.is_available ? "status-available" : "status-occupied"
                                                                }`}>
                                                                    {item.is_available ? (
                                                                        <CheckCircle size={12} style={{ marginRight: "3px" }} />
                                                                    ) : (
                                                                        <XCircle size={12} style={{ marginRight: "3px" }} />
                                                                    )}
                                                                    {item.is_available ? "Available" : "Unavailable"}
                                                                </span>
                                                            </td>
                                                            {isEditor && (
                                                                <td className="table-actions">
                                                                    {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "LabTechnician") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                                        <>
                                                                            <button 
                                                                                className="btn-icon btn-edit"
                                                                                onClick={() => handleEditClick(item)}
                                                                                title="Edit Test Details"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                            <button 
                                                                                className="btn-icon btn-delete"
                                                                                onClick={() => handleDeleteClick(item.id, item.test_name, item.health_centre_name)}
                                                                                title="Delete Test Record"
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

export default TestsTab;
