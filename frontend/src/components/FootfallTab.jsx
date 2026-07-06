import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, Trash2, X, Clock, AlertCircle, Users, Clipboard } from "lucide-react";
import "./InventoryTab.css"; // Reuse inventory list styles

const FootfallTab = ({ token, user }) => {
    const isEditor = user?.role === "DistrictAdmin" || user?.role === "CenterManager";
    const [dailyData, setDailyData] = useState([]);
    const [centres, setCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCentreFilter, setSelectedCentreFilter] = useState("all");

    const uniqueCentres = useMemo(() => {
        const set = new Set();
        dailyData.forEach(d => {
            if (d.health_centre_name) set.add(d.health_centre_name.trim());
        });
        return Array.from(set).sort();
    }, [dailyData]);

    // Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCentre, setSelectedCentre] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [hourlyList, setHourlyList] = useState([]);
    const [loadingHourly, setLoadingHourly] = useState(false);

    // Form Modal (Add/Edit)
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // Hourly entry ID
    const [formError, setFormError] = useState("");

    // Inputs
    const [healthCentreId, setHealthCentreId] = useState(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
    const [dateInput, setDateInput] = useState("");
    const [hourlySlot, setHourlySlot] = useState("9");
    const [outpatientCount, setOutpatientCount] = useState("");
    const [inpatientCount, setInpatientCount] = useState("");
    const [emergencyCount, setEmergencyCount] = useState("");
    const [avgWaitingTime, setAvgWaitingTime] = useState("");

    const fetchDailyData = async () => {
        try {
            const response = await fetch("http://localhost:5000/footfall", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch footfall metrics");
            setDailyData(data);
            setError("");
        } catch (err) {
            console.error("Fetch daily data error:", err);
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
            console.error("Fetch centres error in FootfallTab:", err);
        }
    };

    const fetchHourlyData = async (centreId, dateStr) => {
        setLoadingHourly(true);
        try {
            const response = await fetch(`http://localhost:5000/footfall/hourly?health_centre_id=${centreId}&date=${encodeURIComponent(dateStr)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch hourly logs");
            setHourlyList(data);
        } catch (err) {
            console.error("Fetch hourly data error:", err);
        } finally {
            setLoadingHourly(false);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchDailyData(), fetchCentres()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError("");
        setHealthCentreId(user?.role === "CenterManager" ? String(user.health_centre_id) : "");
        setDateInput("");
        setHourlySlot("9");
        setOutpatientCount("");
        setInpatientCount("");
        setEmergencyCount("");
        setAvgWaitingTime("");
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleRowClick = (item) => {
        setSelectedCentre(item);
        setSelectedDate(item.date);
        fetchHourlyData(item.health_centre_id, item.date);
        setShowDetailsModal(true);
    };

    const handleEditHourlyClick = (hourlyItem) => {
        setEditingId(hourlyItem.id);
        setHealthCentreId(selectedCentre.health_centre_id);
        setDateInput(new Date(selectedDate).toISOString().split("T")[0]);
        setHourlySlot(hourlyItem.hourly_slot.toString());
        setOutpatientCount(hourlyItem.outpatient_count.toString());
        setInpatientCount(hourlyItem.inpatient_count.toString());
        setEmergencyCount(hourlyItem.emergency_count.toString());
        setAvgWaitingTime(hourlyItem.avg_waiting_time_mins.toString());
        setFormError("");
        setShowForm(true);
    };

    const handleDeleteHourlyClick = async (hourlyItem) => {
        if (!window.confirm(`Are you sure you want to delete this hourly footfall entry?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/footfall/${hourlyItem.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete footfall log");
            }

            // Reload hourly details & daily aggregates
            fetchHourlyData(selectedCentre.health_centre_id, selectedDate);
            fetchDailyData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const payload = {
            health_centre_id: parseInt(healthCentreId),
            date: dateInput,
            hourly_slot: parseInt(hourlySlot),
            outpatient_count: parseInt(outpatientCount),
            inpatient_count: parseInt(inpatientCount),
            emergency_count: parseInt(emergencyCount),
            avg_waiting_time_mins: parseInt(avgWaitingTime)
        };

        const url = editingId 
            ? `http://localhost:5000/footfall/${editingId}`
            : "http://localhost:5000/footfall";
        
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
                throw new Error(data.message || "Failed to save footfall record");
            }

            resetForm();
            fetchDailyData();
            if (selectedCentre) {
                fetchHourlyData(selectedCentre.health_centre_id, selectedDate);
            }
        } catch (err) {
            setFormError(err.message);
        }
    };

    const formatHourSlot = (slot) => {
        const start = slot.toString().padStart(2, "0") + ":00";
        const end = ((slot + 1) % 24).toString().padStart(2, "0") + ":00";
        return `${start} - ${end}`;
    };

    const formatDateString = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // Filters
    const filteredData = dailyData.filter((item) => {
        const query = searchQuery.toLowerCase();
        const formattedDate = formatDateString(item.date).toLowerCase();
        const matchesSearch = (
            item.health_centre_name.toLowerCase().includes(query) ||
            formattedDate.includes(query)
        );
        const matchesFilter = selectedCentreFilter === "all" || item.health_centre_name === selectedCentreFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="inventory-tab-container">
            <div className="tab-header">
                <h2>Patient Footfall & Waiting Analytics</h2>
                {!showForm && isEditor && (
                    <button className="btn btn-primary" onClick={openAddForm}>
                        <Plus size={18} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        Log Hourly Footfall
                    </button>
                )}
            </div>

            {/* Daily Aggregates List */}
             <div className="list-controls">
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Search by facility name or date (e.g. 04 Jul)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-wrapper">
                    <select
                        className="form-control filter-select"
                        value={selectedCentreFilter}
                        onChange={(e) => setSelectedCentreFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.875rem", color: "#1e293b", minWidth: "180px", cursor: "pointer" }}
                    >
                        <option value="all">All Facilities</option>
                        {uniqueCentres.map(cName => (
                            <option key={cName} value={cName}>{cName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <p>Loading patient footfall logs...</p>
                </div>
            ) : error ? (
                <div className="error-state card">
                    <p className="text-danger">⚠️ Error loading footfall data: {error}</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="empty-state card">
                    <p>No footfall records found matching your query.</p>
                </div>
            ) : (
                <div className="table-responsive card">
                    <table className="centres-table clickable-rows">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Facility Name</th>
                                <th>Category</th>
                                <th>Total Outpatients</th>
                                <th>Total Inpatients</th>
                                <th>Emergencies Handled</th>
                                <th>Avg Waiting Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, idx) => (
                                <tr key={`${item.health_centre_id}-${item.date}-${idx}`} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }} title="Click to view hourly logs breakdown">
                                    <td><strong>{formatDateString(item.date)}</strong></td>
                                    <td>{item.health_centre_name}</td>
                                    <td>
                                        <span className={`user-badge ${item.health_centre_type === "CHC" ? "" : "inactive"}`} style={{ margin: 0, padding: "2px 6px" }}>
                                            {item.health_centre_type}
                                        </span>
                                    </td>
                                    <td>{item.total_outpatients} patients</td>
                                    <td>{item.total_inpatients} patients</td>
                                    <td>
                                        <strong className={item.total_emergencies > 5 ? "text-danger" : ""}>
                                            {item.total_emergencies} emergency cases
                                        </strong>
                                    </td>
                                    <td>
                                        <span className={`stock-status-badge ${
                                            item.avg_waiting_time > 30 ? "status-occupied" : item.avg_waiting_time > 15 ? "status-maintenance" : "status-available"
                                        }`}>
                                            <Clock size={12} style={{ marginRight: "3px" }} />
                                            {item.avg_waiting_time} mins
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Hourly Details Modal Popup */}
            {showDetailsModal && selectedCentre && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") setShowDetailsModal(false); }}>
                    <div className="form-card card modal-content" style={{ maxWidth: "800px" }}>
                        <div className="form-card-header">
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedCentre.health_centre_name} Breakdown</h3>
                                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
                                    Logs breakdown for <strong>{formatDateString(selectedDate)}</strong>
                                </p>
                            </div>
                            <button type="button" className="btn-close" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDetailsModal(false); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {loadingHourly ? (
                            <div className="loading-state" style={{ padding: "3rem" }}>
                                <p>Retrieving hourly logs...</p>
                            </div>
                        ) : hourlyList.length === 0 ? (
                            <div className="empty-state" style={{ padding: "3rem" }}>
                                <p>No hourly records exist for this day.</p>
                            </div>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto", marginTop: "1rem" }}>
                                <table className="centres-table">
                                    <thead>
                                        <tr>
                                            <th>Time Slot</th>
                                            <th>Outpatients</th>
                                            <th>Inpatients</th>
                                            <th>Emergencies</th>
                                            <th>Avg Waiting Time</th>
                                            {isEditor && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hourlyList.map((slotItem) => (
                                            <tr key={slotItem.id}>
                                                <td><code>{formatHourSlot(slotItem.hourly_slot)}</code></td>
                                                <td>{slotItem.outpatient_count}</td>
                                                <td>{slotItem.inpatient_count}</td>
                                                <td>{slotItem.emergency_count}</td>
                                                <td>
                                                    <span className={`stock-status-badge ${
                                                        slotItem.avg_waiting_time_mins > 30 ? "status-occupied" : slotItem.avg_waiting_time_mins > 15 ? "status-maintenance" : "status-available"
                                                    }`} style={{ padding: "2px 6px" }}>
                                                        {slotItem.avg_waiting_time_mins} mins
                                                    </span>
                                                </td>
                                                {isEditor && (
                                                    <td className="table-actions">
                                                        {(user?.role === "DistrictAdmin" || (user?.role === "CenterManager" && Number(selectedCentre.health_centre_id) === Number(user.health_centre_id))) ? (
                                                            <>
                                                                <button 
                                                                    className="btn-icon btn-edit"
                                                                    onClick={() => handleEditHourlyClick(slotItem)}
                                                                    title="Edit Hourly Counts"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button 
                                                                    className="btn-icon btn-delete"
                                                                    onClick={() => handleDeleteHourlyClick(slotItem)}
                                                                    title="Delete Entry"
                                                                >
                                                                    <Trash2 size={14} />
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
                </div>
            )}

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") resetForm(); }}>
                    <div className="form-card card modal-content">
                        <div className="form-card-header">
                            <h3>{editingId ? "Edit Hourly Footfall Log" : "Log Hourly Patient Footfall"}</h3>
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
                                        {centres.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dateInput">Date *</label>
                                    <input
                                        type="date"
                                        id="dateInput"
                                        className="form-control"
                                        value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)}
                                        required
                                        disabled={editingId !== null}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="hourlySlot">Hourly Time Slot *</label>
                                    <select
                                        id="hourlySlot"
                                        className="form-control"
                                        value={hourlySlot}
                                        onChange={(e) => setHourlySlot(e.target.value)}
                                        required
                                        disabled={editingId !== null}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i.toString()}>{formatHourSlot(i)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="opCount">Outpatient Count *</label>
                                    <input
                                        type="number"
                                        id="opCount"
                                        className="form-control"
                                        value={outpatientCount}
                                        onChange={(e) => setOutpatientCount(e.target.value)}
                                        placeholder="OPD attendees count"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="ipCount">Inpatient Count *</label>
                                    <input
                                        type="number"
                                        id="ipCount"
                                        className="form-control"
                                        value={inpatientCount}
                                        onChange={(e) => setInpatientCount(e.target.value)}
                                        placeholder="IPD admissions count"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="emergencyCount">Emergency Cases *</label>
                                    <input
                                        type="number"
                                        id="emergencyCount"
                                        className="form-control"
                                        value={emergencyCount}
                                        onChange={(e) => setEmergencyCount(e.target.value)}
                                        placeholder="Trauma / ICU admissions"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="avgWaiting">Avg Waiting Time (Minutes) *</label>
                                    <input
                                        type="number"
                                        id="avgWaiting"
                                        className="form-control"
                                        value={avgWaitingTime}
                                        onChange={(e) => setAvgWaitingTime(e.target.value)}
                                        placeholder="Time to see a doctor"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? "Save Changes" : "Log Footfall"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FootfallTab;
