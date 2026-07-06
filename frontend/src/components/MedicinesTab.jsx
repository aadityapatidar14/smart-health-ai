import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import "./MedicinesTab.css";

const MedicinesTab = ({ token, user }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "Pharmacist";
    const [medicines, setMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

    const categories = useMemo(() => {
        const cats = new Set();
        medicines.forEach(m => {
            if (m.category) cats.add(m.category.trim());
        });
        return Array.from(cats).sort();
    }, [medicines]);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // id
    const [formError, setFormError] = useState("");

    // Inputs
    const [name, setName] = useState("");
    const [genericName, setGenericName] = useState("");
    const [category, setCategory] = useState("");
    const [dosageForm, setDosageForm] = useState("");

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/medicines", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch medicines");
            }

            setMedicines(data);
            setError("");
        } catch (err) {
            console.error("Fetch medicines error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setGenericName("");
        setCategory("");
        setDosageForm("");
        setFormError("");
        setShowForm(false);
    };

    const handleEditClick = (med) => {
        setEditingId(med.id);
        setName(med.name || "");
        setGenericName(med.generic_name || "");
        setCategory(med.category || "");
        setDosageForm(med.dosage_form || "");
        setFormError("");
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!name || !genericName || !category || !dosageForm) {
            setFormError("All fields are required.");
            return;
        }

        const payload = {
            name,
            generic_name: genericName,
            category,
            dosage_form: dosageForm,
        };

        const url = editingId 
            ? `http://localhost:5000/medicines/${editingId}`
            : "http://localhost:5000/medicines";
        
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
                throw new Error(data.message || "Failed to save medicine");
            }

            await fetchMedicines();
            resetForm();
        } catch (err) {
            console.error("Save medicine error:", err);
            setFormError(err.message);
        }
    };

    const handleDeleteClick = async (id, medName) => {
        if (!window.confirm(`Are you sure you want to delete "${medName}" from the catalog?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/medicines/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete medicine");
            }

            await fetchMedicines();
        } catch (err) {
            console.error("Delete medicine error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    // Filter list by query and category filter
    const filteredMedicines = medicines.filter(med => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            med.name.toLowerCase().includes(query) ||
            med.generic_name.toLowerCase().includes(query) ||
            med.category.toLowerCase().includes(query) ||
            med.dosage_form.toLowerCase().includes(query)
        );
        const matchesFilter = selectedCategoryFilter === "all" || med.category === selectedCategoryFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="medicines-tab-container">
            <div className="tab-header">
                <h2>Medicines Catalog Master</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Add Medicine
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Medicine Specifications" : "Catalog New Medicine"}</h3>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && <div className="error-alert">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="medName">Brand / Commercial Name *</label>
                                    <input
                                        type="text"
                                        id="medName"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Paracetamol 650mg"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="genericName">Generic Name *</label>
                                    <input
                                        type="text"
                                        id="genericName"
                                        className="form-control"
                                        value={genericName}
                                        onChange={(e) => setGenericName(e.target.value)}
                                        placeholder="e.g. Paracetamol"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category">Therapeutic Category *</label>
                                    <input
                                        type="text"
                                        id="category"
                                        className="form-control"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Analgesic/Antipyretic, Antibiotic"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dosageForm">Dosage Form *</label>
                                    <input
                                        type="text"
                                        id="dosageForm"
                                        className="form-control"
                                        value={dosageForm}
                                        onChange={(e) => setDosageForm(e.target.value)}
                                        placeholder="e.g. Tablet, Syrup, Injection"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Add to Catalog"}
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
                        placeholder="Search by brand name, generic formulation, or category..."
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
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading medicines catalog database...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading catalog: {error}</p>
                </div>
            ) : filteredMedicines.length === 0 ? (
                <div className="empty-state card">
                    <p>No medicines found matching your query.</p>
                </div>
            ) : (
                <div className="table-responsive card">
                    <table className="centres-table">
                        <thead>
                            <tr>
                                <th>Commercial Name</th>
                                <th>Generic Formulation</th>
                                <th>Category</th>
                                <th>Dosage Form</th>
                                {isEditor && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedicines.map((med) => (
                                <tr key={med.id}>
                                    <td>
                                        <strong>{med.name}</strong>
                                    </td>
                                    <td>{med.generic_name}</td>
                                    <td>
                                        <span className="category-badge">{med.category}</span>
                                    </td>
                                    <td>{med.dosage_form}</td>
                                    {isEditor && (
                                        <td className="table-actions">
                                            <button 
                                                className="btn-icon btn-edit"
                                                onClick={() => handleEditClick(med)}
                                                title="Edit Medicine"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="btn-icon btn-delete"
                                                onClick={() => handleDeleteClick(med.id, med.name)}
                                                title="Delete Medicine"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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

export default MedicinesTab;
