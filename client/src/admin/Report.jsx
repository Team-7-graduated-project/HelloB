import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaSearch, FaSpinner, FaFlag, FaEdit, FaCheck, 
  FaExclamationTriangle, FaFilter, FaCalendarAlt 
} from "react-icons/fa";
import { format } from "date-fns";

function ManageReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReports, setFilteredReports] = useState([]);
  const [visibleReports, setVisibleReports] = useState(10);
  const [editingReport, setEditingReport] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    type: "all",
    dateRange: "all"
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/reports");
      setReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
      alert("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFilters(value, filters);
  };

  const applyFilters = (search = searchQuery, currentFilters = filters) => {
    let filtered = reports;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (report) =>
          report.title?.toLowerCase().includes(search.toLowerCase()) ||
          report.description?.toLowerCase().includes(search.toLowerCase()) ||
          report.reportedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
          report.type?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (currentFilters.status !== "all") {
      filtered = filtered.filter(report => report.status === currentFilters.status);
    }

    // Priority filter
    if (currentFilters.priority !== "all") {
      filtered = filtered.filter(report => {
        const isHighPriority = report.type === "abuse" || report.type === "security";
        return currentFilters.priority === "high" ? isHighPriority : !isHighPriority;
      });
    }

    // Type filter
    if (currentFilters.type !== "all") {
      filtered = filtered.filter(report => report.type === currentFilters.type);
    }

    // Date range filter
    if (currentFilters.dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (currentFilters.dateRange) {
        case "today":
          cutoff.setDate(now.getDate() - 1);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      filtered = filtered.filter(report => new Date(report.createdAt) > cutoff);
    }

    setFilteredReports(filtered);
    setVisibleReports(10);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    applyFilters(searchQuery, newFilters);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getPriorityBadge = (type) => {
    const isHighPriority = type === "abuse" || type === "security";
    return isHighPriority ? (
      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <FaExclamationTriangle />
        High Priority
      </span>
    ) : null;
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setProcessingId(reportId);
      await axios.put(`/api/admin/reports/${reportId}/status`, {
        status: newStatus,
      });

      const updatedReports = reports.map((report) =>
        report._id === reportId ? { ...report, status: newStatus } : report
      );
      setReports(updatedReports);
      setFilteredReports(updatedReports);
      alert(`Report marked as ${newStatus}`);
    } catch (error) {
      console.error("Failed to update report status:", error);
      alert("Failed to update report status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = async (report) => {
    try {
      const response = await axios.put(`/api/admin/reports/${report._id}`, {
        adminNotes: report.adminNotes,
        status: report.status,
      });

      const updatedReports = reports.map((r) =>
        r._id === report._id ? response.data : r
      );
      setReports(updatedReports);
      setFilteredReports(updatedReports);
      setEditingReport(null);
    } catch (error) {
      console.error("Failed to update report:", error);
      alert("Failed to update report");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Report Management</h1>
            <p className="text-white/80">Monitor and manage user reports</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FaExclamationTriangle className="text-gray-400" />
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Priority</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-primary text-3xl" />
        </div>
      ) : (
        <>
          {/* Reports Grid */}
          <div className="grid gap-4">
            {filteredReports.slice(0, visibleReports).map((report) => (
              <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      {getPriorityBadge(report.type)}
                      <span className="text-xs text-gray-500">
                        {format(new Date(report.createdAt), "PP")}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                        {report.type}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-medium text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reported by: {report.reportedBy?.name}
                    </p>
                    
                    {report.adminNotes && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600">
                        {report.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingReport(report)}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Add Notes"
                    >
                      <FaEdit size={24} />
                    </button>
                    {report.status !== "resolved" && (
                      <button
                        onClick={() => handleStatusChange(report._id, "resolved")}
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        disabled={processingId === report._id}
                        title="Resolve"
                      >
                        <FaCheck size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleReports < filteredReports.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleReports((prev) => prev + 10)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold mb-4">Add Admin Notes</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Report Details</h4>
              <p className="text-sm text-gray-600">{editingReport.title}</p>
            </div>
            <textarea
              value={editingReport.adminNotes || ""}
              onChange={(e) =>
                setEditingReport({
                  ...editingReport,
                  adminNotes: e.target.value,
                })
              }
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 h-32 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add your notes here..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(editingReport)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageReportsPage;
