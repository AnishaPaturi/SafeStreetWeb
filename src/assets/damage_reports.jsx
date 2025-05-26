import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../App.css"; // Make sure this includes the improved CSS
import "./damage_reports.css";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";

const BACKEND_URL = "http://localhost:8000";

const generatePDF = (report) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("SafeStreet Damage Report Summary", 20, 20);

  doc.setFontSize(12);
  doc.text("Location: " + report.location, 20, 40);
  doc.text("Summary: " + report.summary, 20, 50);
  doc.text("Status: " + report.status, 20, 60);
  doc.text("Date: " + new Date(report.date).toLocaleDateString(), 20, 70);

  const summaryText = "This report highlights damage at " + report.location + ". Summary: " + report.summary + ". Status: " + report.status + ".";

  doc.text("Details:", 20, 90);
  doc.text(doc.splitTextToSize(summaryText, 170), 20, 100);
  doc.save("Damage_Report_" + report._id + ".pdf");
};

const DamageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingReport, setAcceptingReport] = useState(null);
  const [notification, setNotification] = useState("");
  const timerRef = useRef(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/reports`);
      setReports(res.data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptReport = (report) => {
    setAcceptingReport(report);
    timerRef.current = setTimeout(() => {
      viewReport(report);
      setAcceptingReport(null);
    }, 5000);
  };

  const cancelAccept = () => {
    clearTimeout(timerRef.current);
    setAcceptingReport(null);
  };

  const viewReport = async (report) => {
    alert(`Viewing report ID: ${report._id}`);

    // Generate PDF as blob
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SafeStreet Damage Report Summary", 20, 20);

    doc.setFontSize(12);
    doc.text("Location: " + report.location, 20, 40);
    doc.text("Summary: " + report.summary, 20, 50);
    doc.text("Status: " + report.status, 20, 60);
    doc.text("Date: " + new Date(report.date).toLocaleDateString(), 20, 70);

    const summaryText = "This report highlights damage at " + report.location + ". Summary: " + report.summary + ". Status: " + report.status + ".";

    doc.text("Details:", 20, 90);
    doc.text(doc.splitTextToSize(summaryText, 170), 20, 100);

    // Get PDF as blob
    const pdfBlob = doc.output("blob");

    // Prepare form data to send to backend
    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);
    reader.onloadend = async () => {
      const base64data = reader.result.split(",")[1];

      try {
        // Send report data and base64 PDF to backend
        const response = await axios.post(`${BACKEND_URL}/api/send-report-email`, {
          report,
          pdfBase64: base64data,
        });
        console.log("Email send response:", response.data);
        setNotification("Mail has been sent");
        console.log("Notification set to Mail has been sent");
      } catch (error) {
        console.error("Failed to send report email:", error);
        setNotification("Failed to send mail");
        console.log("Notification set to Failed to send mail");
      }

      // Save/download the PDF locally
      doc.save("Damage_Report_" + report._id + ".pdf");

      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification("");
        console.log("Notification cleared");
      }, 5000);
    };
  };

  const rejectReport = (report) => {
    alert(`Rejected report ID: ${report._id}`);
    // TODO: Implement reject report logic
  };

  useEffect(() => {
    fetchReports();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="damage-reports-container">
      <h1 className="damage-reports-header">Damage Reports</h1>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="damage-reports-content">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Location</th>
                <th>Summary</th>
                <th>Status</th>
                <th>Date</th>
                {/* Image column removed as per request */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => {
                const fullImageUrl = report.imageUrl?.startsWith("http")
                  ? report.imageUrl
                  : `${BACKEND_URL}/${report.imageUrl}`;

                return (
                  <tr key={report._id || index}>
                    <td>{index + 1}</td>
                    <td>{report.location}</td>
                    <td>{report.summary}</td>
                    <td>{report.status}</td>
                    <td>{new Date(report.date).toLocaleDateString()}</td>
                    {/* Image cell removed as per request */}
                    <td>
                      <button
                        onClick={() => acceptReport(report)}
                        className="action-button accept-report-button"
                        disabled={acceptingReport !== null}
                      >
                        Accept Report
                      </button>
                      <button
                        onClick={() => rejectReport(report)}
                        className="action-button reject-report-button"
                        style={{ marginTop: "10px" }}
                        disabled={acceptingReport !== null}
                      >
                        Reject Report
                      </button>
                      {acceptingReport && acceptingReport._id === report._id && (
                        <div className="accept-popup">
                          <p>View Report to confirm</p>
                          <button onClick={cancelAccept}>Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {notification && (
            <div className="notification">
              {notification}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DamageReports;
