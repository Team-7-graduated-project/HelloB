import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaSpinner, FaFlag, FaEdit, FaCheck } from "react-icons/fa";

function ManageReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReports, setFilteredReports] = useState([]);
  const [visibleReports, setVisibleReports] = useState(10);
  const [editingReport, setEditingReport] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

    if (value.trim() === "") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(
        reports.filter(
          (report) =>
            report.title?.toLowerCase().includes(value.toLowerCase()) ||
            report.description?.toLowerCase().includes(value.toLowerCase()) ||
            report.reportedBy?.name
              ?.toLowerCase()
              .includes(value.toLowerCase()) ||
            report.type?.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setVisibleReports(10);
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaFlag className="text-primary" />
        Manage Reports
      </h2>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2 mb-6">
        <FaSearch className="" />
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-primary text-3xl" />
        </div>
      ) : (
        <>
          {/* Reports Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.slice(0, visibleReports).map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {report.title}
                          </span>
                          <span className="text-sm text-gray-500">
                            {report.description}
                          </span>
                          <span className="text-xs text-gray-400">
                            Reported by: {report.reportedBy?.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            Date:{" "}
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-sm font-medium rounded-full bg-gray-100">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-sm font-medium rounded-full ${
                            report.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => setEditingReport(report)}
                          className="bg-blue-500 max-w-32 text-white px-2 py-2 rounded-md hover:bg-blue-600 mr-2"
                        >
                          <div className="flex items-center gap-2">
                            <FaEdit />
                            Add Notes
                          </div>
                        </button>
                        {report.status !== "resolved" && (
                          <button
                            onClick={() =>
                              handleStatusChange(report._id, "resolved")
                            }
                            className="bg-green-500 max-w-28 text-white px-2 py-2 rounded-md hover:bg-green-600"
                            disabled={processingId === report._id}
                          >
                            <div className="flex items-center gap-2">
                              <FaCheck />
                              Resolve
                            </div>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Add Admin Notes</h3>
            <textarea
              value={editingReport.adminNotes || ""}
              onChange={(e) =>
                setEditingReport({
                  ...editingReport,
                  adminNotes: e.target.value,
                })
              }
              className="w-full p-2 border rounded mb-4 h-32"
              placeholder="Add your notes here..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(editingReport)}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageReportsPage;
