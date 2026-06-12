import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Calendar,
  TrendingDown,
  TrendingUp,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Printer,
  AlertCircle,
  Briefcase,
  CreditCard,
  Wallet,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
  Info,
  BadgeDollarSign,
  Gift,
  PlusCircle,
  Download,
} from "lucide-react";
import { endpoints, apiRequest } from "../config/api";
import toast from "react-hot-toast";
import ProtectedModule from "./ProtectedModule";
import { usePasscode } from "../context/PasscodeContext";

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return (
    "PKR " +
    num.toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
};

const formatNum = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusConfig = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  processing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
    label: "Processing",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
    label: "Paid",
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-400",
    label: "Failed",
  },
};

// StatusBadge Component
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ✅ PDF Generation Helper
const generatePayslipPDF = (payroll) => {
  // Create a hidden div for PDF content
  const pdfContent = document.createElement("div");
  pdfContent.style.width = "800px";
  pdfContent.style.padding = "30px";
  pdfContent.style.backgroundColor = "white";
  pdfContent.style.fontFamily = "Arial, sans-serif";
  pdfContent.innerHTML = `
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        .no-print { display: none; }
      }
      .payslip-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      .company-name {
        font-size: 24px;
        font-weight: bold;
        color: #1e3a8a;
        margin-bottom: 5px;
      }
      .payslip-title {
        font-size: 20px;
        font-weight: bold;
        color: #2563eb;
      }
      .employee-section {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #1f2937;
        border-left: 4px solid #2563eb;
        padding-left: 10px;
        margin: 15px 0 10px 0;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
      }
      .info-label {
        font-weight: 600;
        color: #4b5563;
      }
      .info-value {
        color: #1f2937;
      }
      .amount-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }
      .amount-table th, .amount-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      .amount-table th {
        background: #f3f4f6;
        font-weight: 600;
      }
      .text-right {
        text-align: right;
      }
      .net-salary {
        background: #2563eb;
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        text-align: center;
      }
      .net-salary-amount {
        font-size: 28px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
    <div class="payslip-container">
      <div class="header">
        <div class="company-name">Digious Solutions</div>
        <div class="payslip-title">PAYSLIP</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
          ${MONTHS[payroll.month]} ${payroll.year}
        </div>
      </div>
      
      <div class="employee-section">
        <div class="grid-2">
          <div>
            <div class="info-row"><span class="info-label">Employee ID:</span><span class="info-value">${payroll.employee_code || "—"}</span></div>
            <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${payroll.employee_name || "—"}</span></div>
            <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${payroll.department || "—"}</span></div>
          </div>
          <div>
            <div class="info-row"><span class="info-label">Pay Period:</span><span class="info-value">${formatDate(payroll.pay_period_start)} - ${formatDate(payroll.pay_period_end)}</span></div>
            <div class="info-row"><span class="info-label">Issue Date:</span><span class="info-value">${formatDate(payroll.issue_date)}</span></div>
            <div class="info-row"><span class="info-label">Status:</span><span class="info-value">${statusConfig[payroll.status]?.label || "Pending"}</span></div>
          </div>
        </div>
      </div>
      
      <div class="section-title">Earnings</div>
      <table class="amount-table">
        <thead>
          <tr><th>Description</th><th class="text-right">Amount (PKR)</th></tr>
        </thead>
        <tbody>
          <tr><td>Base Salary</td><td class="text-right">${formatNum(payroll.base_salary)}</td></tr>
          ${payroll.total_allowances > 0 ? `<tr><td>Total Allowances</td><td class="text-right">${formatNum(payroll.total_allowances)}</td></tr>` : ""}
          ${payroll.bonus > 0 ? `<tr><td>Bonus</td><td class="text-right">${formatNum(payroll.bonus)}</td></tr>` : ""}
          ${payroll.adjustment !== 0 ? `<tr><td>Adjustment</td><td class="text-right">${payroll.adjustment > 0 ? "+" : ""}${formatNum(payroll.adjustment)}</td></tr>` : ""}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f3f4f6;"><td>Gross Salary</td><td class="text-right">${formatNum(payroll.gross_salary)}</td></tr>
        </tfoot>
      </table>
      
      <div class="section-title">Deductions</div>
      <table class="amount-table">
        <thead>
          <tr><th>Description</th><th class="text-right">Amount (PKR)</th></tr>
        </thead>
        <tbody>
          ${payroll.absent_deduction > 0 ? `<tr><td>Absent Days (${payroll.absent_days} days)</td><td class="text-right">−${formatNum(payroll.absent_deduction)}</td></tr>` : ""}
          ${payroll.late_deduction > 0 ? `<tr><td>Late Deduction (${payroll.late_days} lates)</td><td class="text-right">−${formatNum(payroll.late_deduction)}</td></tr>` : ""}
          ${payroll.advance_deduction > 0 ? `<tr><td>Advance/Loan Deduction</td><td class="text-right">−${formatNum(payroll.advance_deduction)}</td></tr>` : ""}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f3f4f6;"><td>Total Deductions</td><td class="text-right">−${formatNum(payroll.total_deductions + (payroll.advance_deduction || 0))}</td></tr>
        </tfoot>
      </table>
      
      <div class="section-title">Attendance Summary</div>
      <table class="amount-table">
        <thead>
          <tr><th>Type</th><th class="text-right">Days</th></tr>
        </thead>
        <tbody>
          <tr><td>Present</td><td class="text-right">${payroll.present_days || 0}</td></tr>
          <tr><td>Absent (Unpaid)</td><td class="text-right">${payroll.absent_days || 0}</td></tr>
          <tr><td>Late</td><td class="text-right">${payroll.late_days || 0}</td></tr>
          <tr><td>Paid Leave</td><td class="text-right">${payroll.leave_days || 0}</td></tr>
          <tr><td>Half Day</td><td class="text-right">${payroll.half_days || 0}</td></tr>
        </tbody>
      </table>
      
      <div class="net-salary">
        <div style="font-size: 14px; opacity: 0.9;">Net Salary</div>
        <div class="net-salary-amount">PKR ${formatNum(payroll.net_salary)}</div>
        <div style="font-size: 11px; margin-top: 5px;">(Amount in words: ${numberToWords(Math.floor(payroll.net_salary))} Rupees Only)</div>
      </div>
      
      <div class="footer">
        <p>This is a system-generated payslip. For any discrepancies, please contact HR department.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  // Open print window
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Payslip - ${MONTHS[payroll.month]} ${payroll.year}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${pdfContent.innerHTML}
        <div class="no-print" style="text-align: center; margin-top: 20px; padding: 10px;">
          <button onclick="window.print();" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🖨️ Print / Save as PDF</button>
          <button onclick="window.close();" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
        <script>
          // Auto-trigger print dialog
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Helper function to convert number to words (simple version)
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
  return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "");
};

// PaySlip Modal with Download Button
const PaySlipModal = ({ payroll, onClose }) => {
  if (!payroll) return null;

  const dailyRateNote = `${formatNum(payroll.base_salary)} ÷ 30 = ${formatNum(payroll.daily_rate)}/day`;

  const handleDownload = () => {
    generatePayslipPDF(payroll);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Payslip — {MONTHS[payroll.month]} {payroll.year}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pay Period: {formatDate(payroll.pay_period_start)} →{" "}
                {formatDate(payroll.pay_period_end)}
                {payroll.days_in_month && ` (${payroll.days_in_month} days)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ Download Button */}
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Download Payslip"
              >
                <Download className="h-5 w-5 text-blue-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Rest of the modal content remains the same */}
        <div className="p-6 space-y-5">
          {/* Employee Card */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {(payroll.employee_name || "?")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate">
                {payroll.employee_name}
              </p>
              <p className="text-sm text-slate-500">
                {payroll.employee_code} •{" "}
                {payroll.designation || payroll.department}
              </p>
            </div>
            <StatusBadge status={payroll.status} />
          </div>

          {/* Issue Date Banner */}
          {payroll.issue_date && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                <span className="font-medium">Expected Issue Date:</span>{" "}
                {formatDate(payroll.issue_date)}
              </p>
            </div>
          )}

          {/* Salary Calculation Info */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
            <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Daily Rate: <span className="font-semibold">{dailyRateNote}</span>{" "}
              (always ÷ 30 regardless of month length)
            </p>
          </div>

          {/* Earnings & Deductions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Earnings */}
            <div className="border border-emerald-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" /> Earnings
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base Salary</span>
                  <span className="font-medium text-slate-800">
                    {formatNum(payroll.base_salary)}
                  </span>
                </div>
                {payroll.allowances && payroll.allowances.length > 0 ? (
                  payroll.allowances.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {a.name} {a.currency !== "PKR" ? `(${a.currency})` : ""}
                      </span>
                      <span className="font-medium text-emerald-600">
                        +
                        {formatNum(
                          a.currency !== "PKR"
                            ? a.amount * (a.exchange_rate || 1)
                            : a.amount,
                        )}
                      </span>
                    </div>
                  ))
                ) : payroll.total_allowances > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Allowances</span>
                    <span className="font-medium text-emerald-600">
                      +{formatNum(payroll.total_allowances)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 mt-2 border-t border-emerald-100">
                  <span className="font-bold text-sm text-slate-700">
                    Gross Salary
                  </span>
                  <span className="font-bold text-sm text-emerald-700">
                    {formatNum(payroll.gross_salary)}
                  </span>
                </div>
                {(payroll.bonus || 0) > 0 && (
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5" /> Bonus
                    </span>
                    <span className="font-medium text-emerald-600">
                      +{formatNum(payroll.bonus)}
                    </span>
                  </div>
                )}
                {(payroll.adjustment || 0) !== 0 && (
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-blue-600 flex items-center gap-1">
                      <PlusCircle className="h-3.5 w-3.5" /> Adjustment
                      {payroll.adjustment_reason && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({payroll.adjustment_reason})
                        </span>
                      )}
                    </span>
                    <span
                      className={`font-medium ${payroll.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}
                    >
                      {payroll.adjustment > 0 ? "+" : ""}
                      {formatNum(payroll.adjustment)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-rose-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
                <h3 className="font-semibold text-rose-800 flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4" /> Deductions
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {payroll.absent_deduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Unpaid Absent{" "}
                      <span className="text-slate-400">
                        ({payroll.absent_days}d × {formatNum(payroll.daily_rate)})
                      </span>
                    </span>
                    <span className="font-medium text-rose-600">
                      −{formatNum(payroll.absent_deduction)}
                    </span>
                  </div>
                )}
                {payroll.leave_days > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">
                      Paid Leaves ({payroll.leave_days}d)
                    </span>
                    <span className="font-medium text-emerald-600">0</span>
                  </div>
                )}
                {payroll.late_deduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Late{" "}
                      <span className="text-slate-400">
                        ({payroll.late_days} lates = {payroll.late_deduction_days}d)
                      </span>
                    </span>
                    <span className="font-medium text-amber-600">
                      −{formatNum(payroll.late_deduction)}
                    </span>
                  </div>
                )}
                {(payroll.advance_deduction || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Advance / Loan Deduction</span>
                    <span className="font-medium text-purple-600">
                      −{formatNum(payroll.advance_deduction)}
                    </span>
                  </div>
                )}
                {payroll.total_deductions === 0 &&
                  (payroll.advance_deduction || 0) === 0 && (
                    <p className="text-sm text-slate-400">No deductions</p>
                  )}
                <div className="flex justify-between pt-2 mt-2 border-t border-rose-100">
                  <span className="font-bold text-sm text-slate-700">
                    Total Deductions
                  </span>
                  <span className="font-bold text-sm text-rose-700">
                    −
                    {formatNum(
                      parseFloat(payroll.total_deductions || 0) +
                        parseFloat(payroll.advance_deduction || 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Net Salary</p>
                <p className="text-3xl font-bold mt-1">
                  PKR {formatNum(payroll.net_salary)}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  {formatNum(payroll.gross_salary)}
                  {(payroll.bonus || 0) > 0 &&
                    ` + ${formatNum(payroll.bonus)} bonus`}
                  {(payroll.adjustment || 0) !== 0 &&
                    ` + ${formatNum(payroll.adjustment)} adj`}
                  {` − ${formatNum(payroll.total_deductions)} deductions`}
                  {(payroll.advance_deduction || 0) > 0 &&
                    ` − ${formatNum(payroll.advance_deduction)} advance/loan`}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Attendance Summary —{" "}
                {MONTHS[payroll.month]} {payroll.year}
                {payroll.days_in_month && (
                  <span className="text-slate-400 font-normal">
                    ({payroll.days_in_month} days in month)
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4 grid grid-cols-5 gap-3">
              {[
                { label: "Present", value: payroll.present_days || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Absent", value: payroll.absent_days || 0, color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Late", value: payroll.late_days || 0, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Paid Leave", value: payroll.leave_days || 0, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Half Day", value: payroll.half_days || 0, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((s) => (
                <div key={s.label} className={`text-center p-3 ${s.bg} rounded-lg`}>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          {payroll.bank_name && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-slate-400 text-xs">Bank</p><p className="font-medium text-slate-800">{payroll.bank_name}</p></div>
                <div><p className="text-slate-400 text-xs">Account</p><p className="font-medium text-slate-800">{payroll.account_number}</p></div>
                <div><p className="text-slate-400 text-xs">Title</p><p className="font-medium text-slate-800">{payroll.account_title_name}</p></div>
              </div>
            </div>
          )}

          {payroll.notes && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{payroll.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Download Payslip
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rest of the EmployeePayrollPage component remains the same...
// (Keep all the existing code from your original component below)

// ─── Main Employee Payroll Page ───────────────────────
const EmployeePayrollPage = () => {
  // ... existing code (fetchPayroll, state, etc.)
  // Keep everything exactly as in your original component
  // Just update the View button to open modal with download

  const [records, setRecords] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipLoading, setPayslipLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest(endpoints.payroll.myPayroll);
      if (response.success) {
        setEmployee(response.data.employee);
        setRecords(response.data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch payroll:", err);
      setError(err.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const viewPayslip = async (record) => {
    try {
      setPayslipLoading(record.id);
      const response = await apiRequest(endpoints.payroll.myPayslip(record.id));
      if (response.success) {
        setSelectedPayslip(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payslip:", err);
      toast.error("Failed to load payslip: " + (err.message || "Unknown error"));
    } finally {
      setPayslipLoading(null);
    }
  };

  const latest = records[0] || null;
  const totalEarned = records
    .filter((r) => r.status === "success")
    .reduce((sum, r) => sum + r.net_salary, 0);
  const totalDeductions = records.reduce((sum, r) => sum + r.total_deductions, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading your payroll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-700 font-semibold">{error}</p>
          <button
            onClick={fetchPayroll}
            className="mt-4 px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedModule
      moduleName="emp_payroll"
      title="Employee Payroll"
      description="Sensitive employee payroll information. Access requires security verification."
    >
      <div className="p-4 md:p-6 lg:p-8 max-w-full mx-auto space-y-6">
        {/* Summary Cards - same as your existing code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Current Net Salary", value: latest ? formatCurrency(latest.net_salary) : "—", sub: latest ? `${MONTHS[latest.month]} ${latest.year}` : "No data", icon: BadgeDollarSign, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Base Salary", value: latest ? formatCurrency(latest.base_salary) : "—", sub: latest ? `Daily: PKR ${formatNum(latest.daily_rate)}` : "÷ 30", icon: Briefcase, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { label: "Total Paid", value: formatCurrency(totalEarned), sub: `${records.filter((r) => r.status === "success").length} payslip(s)`, icon: TrendingUp, iconBg: "bg-green-50", iconColor: "text-green-600" },
            { label: "Total Deductions", value: formatCurrency(totalDeductions), sub: "All time", icon: TrendingDown, iconBg: "bg-rose-50", iconColor: "text-rose-600" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-800">{card.label}</span>
                  <div className={`p-2 ${card.iconBg} rounded-lg`}><Icon className={`h-4 w-4 ${card.iconColor}`} /></div>
                </div>
                <p className="text-3xl font-bold text-blue-600">{card.value}</p>
                <p className="text-xs text-blue-600 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Salary History Table - same as your existing code */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-slate-500" /> Payroll History
            </h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="h-14 w-14 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">No Payroll Records Found</p>
              <p className="text-sm text-slate-400 mt-1">Your payroll records will appear here once generated by admin.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay Period</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Days</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Salary</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowances</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bonus/Adj</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{MONTHS[r.month]} {r.year}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{r.pay_period_start ? `${formatDate(r.pay_period_start)} → ${formatDate(r.pay_period_end)}` : `${r.month}/${r.year}`}</p>
                        </td>
                        <td className="px-5 py-4 text-center"><span className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">{r.days_in_month || r.working_days || 30}d</span></td>
                        <td className="px-5 py-4 text-center font-medium text-slate-700">{formatNum(r.base_salary)}</td>
                        <td className="px-5 py-4 text-center text-emerald-600 font-medium">+{formatNum(r.total_allowances)}</td>
                        <td className="px-5 py-4 text-center text-rose-600 font-medium">{r.total_deductions > 0 ? `−${formatNum(r.total_deductions)}` : <span className="text-slate-300">0</span>}</td>
                        <td className="px-5 py-4 text-center">
                          <div className="space-y-0.5">
                            {(r.bonus || 0) > 0 && <span className="text-xs font-medium text-emerald-600 block">+{formatNum(r.bonus)}</span>}
                            {(r.adjustment || 0) !== 0 && <span className={`text-xs font-medium block ${r.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}>{r.adjustment > 0 ? "+" : ""}{formatNum(r.adjustment)}</span>}
                            {!r.bonus && !r.adjustment && <span className="text-slate-300">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center"><p className="font-bold text-blue-700">{formatNum(r.net_salary)}</p></td>
                        <td className="px-5 py-4"><div className="flex items-center justify-center gap-1.5"><span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">P:{r.present_days}</span><span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-medium">A:{r.absent_days}</span><span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">L:{r.late_days}</span></div></td>
                        <td className="px-5 py-4 text-center"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-4 text-center text-xs text-slate-500">{r.issue_date ? formatDate(r.issue_date) : "—"}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => viewPayslip(r)} disabled={payslipLoading === r.id} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold inline-flex items-center gap-1.5">
                            {payslipLoading === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            View
                          </button>
                        </td>
                       </tr>
                    ))}
                  </tbody>
                 </table>
              </div>

              {/* Mobile Cards - same as your existing code */}
              <div className="lg:hidden divide-y divide-slate-100">
                {records.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <div key={r.id} className="p-4">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><p className="font-semibold text-slate-800">{SHORT_MONTHS[r.month]} {r.year}</p><StatusBadge status={r.status} /></div>
                          <p className="text-lg font-bold text-blue-700 mt-0.5">PKR {formatNum(r.net_salary)}</p>
                          {r.issue_date && <p className="text-xs text-slate-400 mt-0.5">Issue: {formatDate(r.issue_date)}</p>}
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Pay Period</span></div>
                            <div className="text-right text-slate-700 text-xs">{r.pay_period_start ? `${formatDate(r.pay_period_start)} → ${formatDate(r.pay_period_end)}` : `${r.month}/${r.year}`}</div>
                            <div><span className="text-slate-500">Days in Month</span></div><div className="text-right text-slate-700">{r.days_in_month || r.working_days || 30}</div>
                            <div><span className="text-slate-500">Base Salary</span></div><div className="text-right text-slate-700">{formatNum(r.base_salary)}</div>
                            <div><span className="text-slate-500">Allowances</span></div><div className="text-right text-emerald-600">+{formatNum(r.total_allowances)}</div>
                            <div><span className="text-slate-500">Deductions</span></div><div className="text-right text-rose-600">−{formatNum(r.total_deductions)}</div>
                            {(r.bonus || 0) > 0 && <><div><span className="text-slate-500">Bonus</span></div><div className="text-right text-emerald-600">+{formatNum(r.bonus)}</div></>}
                            {(r.adjustment || 0) !== 0 && <><div><span className="text-slate-500">Adjustment</span></div><div className={`text-right ${r.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}>{r.adjustment > 0 ? "+" : ""}{formatNum(r.adjustment)}</div></>}
                            <div><span className="text-slate-500">Attendance</span></div><div className="text-right text-slate-700">P:{r.present_days} A:{r.absent_days} L:{r.late_days}</div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); viewPayslip(r); }} disabled={payslipLoading === r.id} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            {payslipLoading === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            View Full Payslip
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* PaySlip Modal */}
        {selectedPayslip && (
          <PaySlipModal payroll={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
        )}
      </div>
    </ProtectedModule>
  );
};

export default EmployeePayrollPage;

