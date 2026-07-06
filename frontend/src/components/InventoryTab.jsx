import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import "./InventoryTab.css";

const InventoryTab = ({ token, user, filterCentreId }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager" || user?.role === "Pharmacist";
    const [inventory, setInventory] = useState([]);
    const [centres, setCentres] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStockFilter, setSelectedStockFilter] = useState("all");
    const [expandedCentres, setExpandedCentres] = useState({});

    const effectiveFilterCentreId = filterCentreId !== undefined ? filterCentreId : (user?.role !== "DistrictAdmin" ? user?.health_centre_id : null);

    // Filter list by query and safety stock filter
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                (item.health_centre_name && item.health_centre_name.toLowerCase().includes(query)) ||
                (item.medicine_name && item.medicine_name.toLowerCase().includes(query)) ||
                (item.medicine_generic && item.medicine_generic.toLowerCase().includes(query)) ||
                (item.medicine_category && item.medicine_category.toLowerCase().includes(query))
            );
            let matchesFilter = true;
            if (selectedStockFilter === "out") {
                matchesFilter = item.current_stock === 0;
            } else if (selectedStockFilter === "low") {
                matchesFilter = item.current_stock > 0 && item.current_stock <= item.min_required_stock;
            } else if (selectedStockFilter === "normal") {
                matchesFilter = item.current_stock > item.min_required_stock;
            }
            const matchesDirectEdit = !effectiveFilterCentreId || Number(item.health_centre_id) === Number(effectiveFilterCentreId);
            return matchesSearch && matchesFilter && matchesDirectEdit;
        });
    }, [inventory, searchQuery, selectedStockFilter, effectiveFilterCentreId]);

    const inventoryByCentre = useMemo(() => {
        const groups = {};
        filteredInventory.forEach(item => {
            const cName = item.health_centre_name || "Unassigned";
            if (!groups[cName]) {
                groups[cName] = [];
            }
            groups[cName].push(item);
        });
        return groups;
    }, [filteredInventory]);

    const isSearchingOrFiltering = searchQuery.trim() !== "" || selectedStockFilter !== "all";

    const toggleCentreExpand = (cName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [cName]: !prev[cName]
        }));
    };

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // inventory id
    const [formError, setFormError] = useState("");

    // Inputs
    const [healthCentreId, setHealthCentreId] = useState(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
    const [medicineId, setMedicineId] = useState("");
    const [currentStock, setCurrentStock] = useState("");
    const [minRequiredStock, setMinRequiredStock] = useState("");
    const [reorderLevel, setReorderLevel] = useState("");

    const fetchInventory = async () => {
        try {
            const response = await fetch("http://localhost:5000/inventory", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch stock inventory");
            }

            setInventory(data);
            setError("");
        } catch (err) {
            console.error("Fetch inventory error:", err);
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
            console.error("Fetch centres error in InventoryTab:", err);
        }
    };

    const fetchMedicines = async () => {
        try {
            const response = await fetch("http://localhost:5000/medicines", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch medicines list");
            }

            setMedicines(data);
        } catch (err) {
            console.error("Fetch medicines error in InventoryTab:", err);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchInventory(), fetchCentres(), fetchMedicines()]);
            setLoading(false);
        };

        loadAllData();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setHealthCentreId(user?.role !== "DistrictAdmin" ? String(user.health_centre_id) : "");
        setMedicineId("");
        setCurrentStock("");
        setMinRequiredStock("");
        setReorderLevel("");
        setFormError("");
        setShowForm(false);
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setHealthCentreId(item.health_centre_id || "");
        setMedicineId(item.medicine_id || "");
        setCurrentStock(item.current_stock !== undefined ? item.current_stock : "");
        setMinRequiredStock(item.min_required_stock !== undefined ? item.min_required_stock : "");
        setReorderLevel(item.reorder_level !== undefined ? item.reorder_level : "");
        setFormError("");
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (
            !healthCentreId ||
            !medicineId ||
            currentStock === "" ||
            minRequiredStock === "" ||
            reorderLevel === ""
        ) {
            setFormError("All fields are required.");
            return;
        }

        const payload = {
            health_centre_id: Number(healthCentreId),
            medicine_id: Number(medicineId),
            current_stock: Number(currentStock),
            min_required_stock: Number(minRequiredStock),
            reorder_level: Number(reorderLevel),
        };

        const url = editingId 
            ? `http://localhost:5000/inventory/${editingId}`
            : "http://localhost:5000/inventory";
        
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
                throw new Error(data.message || "Failed to save stock inventory details");
            }

            await fetchInventory();
            resetForm();
        } catch (err) {
            console.error("Save inventory error:", err);
            setFormError(err.message);
        }
    };

    const handleDeleteClick = async (id, medName, centreName) => {
        if (!window.confirm(`Are you sure you want to delete the stock record of "${medName}" at "${centreName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/inventory/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete inventory record");
            }

            await fetchInventory();
        } catch (err) {
            console.error("Delete inventory error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const getStockStatus = (current, reorder) => {
        if (current === 0) return { label: "Stock Out", className: "stock-out" };
        if (current <= reorder) return { label: "Low Stock", className: "low-stock" };
        return { label: "Normal", className: "normal" };
    };

    // filteredInventory is memoized at the top of the component

    return (
        <div className="inventory-tab-container">
            <div className="tab-header">
                <h2>Health Centre Stock Inventory</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={openAddForm}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Stock Inventory
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Stock Level Details" : "Record New Medicine Stock"}</h3>
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
                                    <label htmlFor="medicine">Medicine / Drug *</label>
                                    <select
                                        id="medicine"
                                        className="form-control"
                                        value={medicineId}
                                        onChange={(e) => setMedicineId(e.target.value)}
                                        required
                                        disabled={editingId !== null}
                                    >
                                        <option value="">-- Select Drug --</option>
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.generic_name})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="currentStock">Current Stock Level *</label>
                                    <input
                                        type="number"
                                        id="currentStock"
                                        className="form-control"
                                        value={currentStock}
                                        onChange={(e) => setCurrentStock(e.target.value)}
                                        placeholder="Available items count"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="minRequiredStock">Safety Buffer Stock (Min) *</label>
                                    <input
                                        type="number"
                                        id="minRequiredStock"
                                        className="form-control"
                                        value={minRequiredStock}
                                        onChange={(e) => setMinRequiredStock(e.target.value)}
                                        placeholder="Minimum required safety stock"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reorderLevel">Reorder Trigger Level *</label>
                                    <input
                                        type="number"
                                        id="reorderLevel"
                                        className="form-control"
                                        value={reorderLevel}
                                        onChange={(e) => setReorderLevel(e.target.value)}
                                        placeholder="Level to trigger low stock flag"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Record Stock"}
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
                        placeholder="Search by facility name, medicine name, generic name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedStockFilter}
                        onChange={(e) => setSelectedStockFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "160px", cursor: "pointer" }}
                    >
                        <option value="all">All Safety Levels</option>
                        <option value="out">Stock Out</option>
                        <option value="low">Low Stock</option>
                        <option value="normal">Sufficient / Normal</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading stock inventory...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading stock inventory: {error}</p>
                </div>
            ) : filteredInventory.length === 0 ? (
                <div className="empty-state card">
                    <p>No stock inventory records found matching your query.</p>
                </div>
            ) : (isSearchingOrFiltering || effectiveFilterCentreId) ? (
                // Full flat list when searching/filtering
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Health Centre</th>
                                <th>Medicine Name</th>
                                <th>Generic Formulation</th>
                                <th>Current Stock</th>
                                <th>Min Required</th>
                                <th>Reorder Level</th>
                                <th>Status</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map((item) => {
                                const status = getStockStatus(item.current_stock, item.reorder_level);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.health_centre_name}</strong>
                                        </td>
                                        <td>{item.medicine_name}</td>
                                        <td>{item.medicine_generic}</td>
                                        <td>
                                            <strong>{item.current_stock}</strong>
                                        </td>
                                        <td>{item.min_required_stock}</td>
                                        <td>{item.reorder_level}</td>
                                        <td>
                                            <span className={`stock-status-badge ${status.className}`}>
                                                {status.label === "Stock Out" && <AlertCircle size={12} style={{ marginRight: "3px" }} />}
                                                {status.label}
                                            </span>
                                        </td>
                                        {isEditor && (
                                            <td className="table-actions">
                                                {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "Pharmacist") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                    <>
                                                        <button 
                                                            className="btn-icon btn-edit"
                                                            onClick={() => handleEditClick(item)}
                                                            title="Edit Stock Levels"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn-icon btn-delete"
                                                            onClick={() => handleDeleteClick(item.id, item.medicine_name, item.health_centre_name)}
                                                            title="Delete Stock Record"
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
                    {Object.keys(inventoryByCentre).sort().map(cName => {
                        const centreItems = inventoryByCentre[cName];
                        const totalItems = centreItems.length;
                        const lowStockItems = centreItems.filter(i => i.current_stock > 0 && i.current_stock <= i.min_required_stock).length;
                        const outOfStockItems = centreItems.filter(i => i.current_stock === 0).length;
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
                                            {totalItems} Stock Items
                                        </span>
                                        {lowStockItems > 0 && (
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#f59e0b", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                                {lowStockItems} Low Stock
                                            </span>
                                        )}
                                        {outOfStockItems > 0 && (
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                                                {outOfStockItems} Out of Stock
                                            </span>
                                        )}
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
                                                    <th>Medicine Name</th>
                                                    <th>Generic Formulation</th>
                                                    <th>Current Stock</th>
                                                    <th>Min Required</th>
                                                    <th>Reorder Level</th>
                                                    <th>Status</th>
                                                    {isEditor && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {centreItems.map((item) => {
                                                    const status = getStockStatus(item.current_stock, item.reorder_level);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{item.medicine_name}</td>
                                                            <td>{item.medicine_generic}</td>
                                                            <td>
                                                                <strong>{item.current_stock}</strong>
                                                            </td>
                                                            <td>{item.min_required_stock}</td>
                                                            <td>{item.reorder_level}</td>
                                                            <td>
                                                                <span className={`stock-status-badge ${status.className}`}>
                                                                    {status.label === "Stock Out" && <AlertCircle size={12} style={{ marginRight: "3px" }} />}
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            {isEditor && (
                                                                <td className="table-actions">
                                                                    {(user?.role === "DistrictAdmin" || ((user?.role === "CenterManager" || user?.role === "Pharmacist") && Number(item.health_centre_id) === Number(user.health_centre_id))) ? (
                                                                        <>
                                                                            <button 
                                                                                className="btn-icon btn-edit"
                                                                                onClick={() => handleEditClick(item)}
                                                                                title="Edit Stock Levels"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                            <button 
                                                                                className="btn-icon btn-delete"
                                                                                onClick={() => handleDeleteClick(item.id, item.medicine_name, item.health_centre_name)}
                                                                                title="Delete Stock Record"
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

export default InventoryTab;
