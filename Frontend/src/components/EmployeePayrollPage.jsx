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
  Target,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { endpoints, apiRequest } from "../config/api";
import toast from "react-hot-toast";
import ProtectedModule from "./ProtectedModule";
import { usePasscode } from "../context/PasscodeContext";
import companyLogo from '../NEW_SHADOW.png';

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

// ✅ ADDED: Helper function to convert number to words
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num < 20) return ones[num];
  if (num < 100)
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    );
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "")
    );
  if (num < 100000)
    return (
      numberToWords(Math.floor(num / 1000)) +
      " Thousand" +
      (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
    );
  if (num < 10000000)
    return (
      numberToWords(Math.floor(num / 100000)) +
      " Lakh" +
      (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
    );
  return (
    numberToWords(Math.floor(num / 10000000)) +
    " Crore" +
    (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
  );
};

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

const formatUSD = (amount) => {
  const num = parseFloat(amount) || 0;
  return (
    "$" +
    num.toLocaleString("en-US", {
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

// ✅ Updated PDF Generation Helper with Sales Details
const generatePayslipPDF = (payroll, companyLogo = null) => {
  const currentDate = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isSalesEmployee = payroll.department === "Sales" || payroll.department?.toLowerCase() === "sales";
  const commissionAmount = parseFloat(payroll.commission_amount_pkr) || 0;
  const netSales = parseFloat(payroll.net_sales) || 0;
  const commissionPercent = parseFloat(payroll.commission_percentage) || 0;
  const conversionRate = parseFloat(payroll.dollar_conversion_rate) || 280;

  const logoHTML = companyLogo
    ? `<img src="${companyLogo}" alt="Company Logo" style="height: 50px; width: auto; object-fit: contain; max-height: 55px;" />`
    : `
      <svg viewBox="0 0 100 100" width="50" height="50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="12" fill="#2563eb"/>
        <text x="50" y="68" text-anchor="middle" font-size="40" font-weight="700" fill="white" font-family="Arial">D</text>
      </svg>
    `;

  const pdfContent = document.createElement("div");
  pdfContent.style.width = "794px";
  pdfContent.style.padding = "20px 25px";
  pdfContent.style.backgroundColor = "white";
  pdfContent.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  pdfContent.style.fontSize = "12px";
  pdfContent.style.boxSizing = "border-box";
  
  pdfContent.innerHTML = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      .payslip {
        width: 100%;
        max-width: 794px;
        margin: 0 auto;
        background: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 11px;
        color: #1e293b;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px 8px 16px;
        border-bottom: 3px solid #2563eb;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        border-radius: 6px 6px 0 0;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo-box {
        width: auto;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }
      .logo-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .logo-box svg {
        width: 48px;
        height: 48px;
      }
      .header-right {
        text-align: right;
      }
      .header-right .title {
        font-size: 20px;
        font-weight: 800;
        color: #2563eb;
        letter-spacing: 2px;
      }
      .header-right .period {
        font-size: 10px;
        color: #64748b;
        font-weight: 500;
      }
      
      .employee-info {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4px 20px;
        padding: 10px 16px;
        background: #f8fafc;
        border-radius: 6px;
        margin: 8px 0 10px 0;
        border: 1px solid #e2e8f0;
      }
      .emp-item {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        border-bottom: 1px dashed #e2e8f0;
      }
      .emp-item:last-child {
        border-bottom: none;
      }
      .emp-label {
        font-size: 9px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .emp-value {
        font-size: 11px;
        font-weight: 500;
        color: #0f172a;
      }
      .status-badge {
        display: inline-block;
        padding: 1px 10px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .status-badge.paid { background: #dcfce7; color: #166534; }
      .status-badge.pending { background: #fef3c7; color: #92400e; }
      .status-badge.draft { background: #e2e8f0; color: #475569; }
      .status-badge.approved { background: #dbeafe; color: #1e40af; }
      
      .section-title {
        font-size: 10px;
        font-weight: 700;
        color: #1e293b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 6px 0 4px 0;
        margin: 6px 0 4px 0;
        border-bottom: 1.5px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-title .bar {
        display: inline-block;
        width: 3px;
        height: 14px;
        background: #2563eb;
        border-radius: 2px;
      }
      
      .table-wrap {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 2px 0 4px 0;
      }
      .table-wrap .table-col {
        min-width: 0;
      }
      .amount-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
      }
      .amount-table th {
        background: #f1f5f9;
        color: #64748b;
        font-weight: 600;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 5px 10px;
        text-align: left;
        border-bottom: 1.5px solid #e2e8f0;
      }
      .amount-table td {
        padding: 4px 10px;
        border-bottom: 1px solid #f1f5f9;
      }
      .amount-table tr:last-child td {
        border-bottom: none;
      }
      .amount-table .text-right {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .amount-table .total-row td {
        font-weight: 700;
        font-size: 11px;
        border-top: 2px solid #2563eb;
        padding-top: 6px;
        background: #f8fafc;
      }
      .amount-table .negative { color: #dc2626; }
      .amount-table .positive { color: #16a34a; }
      
      .net-salary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%);
        border-radius: 8px;
        padding: 12px 20px;
        margin: 10px 0 6px 0;
      }
      .net-salary .left .label {
        color: rgba(255,255,255,0.7);
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .net-salary .left .words {
        color: rgba(255,255,255,0.5);
        font-size: 9px;
        font-weight: 300;
        margin-top: 1px;
      }
      .net-salary .amount {
        color: white;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .net-salary .amount .curr {
        font-size: 12px;
        opacity: 0.6;
        font-weight: 400;
        margin-right: 2px;
      }
      
      .attendance-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
        padding: 6px 0;
      }
      .attendance-item {
        text-align: center;
        background: #f8fafc;
        border-radius: 4px;
        padding: 4px 2px;
        border: 1px solid #e2e8f0;
      }
      .attendance-item .num {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
      }
      .attendance-item .lbl {
        font-size: 8px;
        color: #94a3b8;
        font-weight: 500;
      }
      
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px 0 16px;
        border-top: 1px solid #e2e8f0;
        margin-top: 8px;
        font-size: 8px;
        color: #94a3b8;
      }
      .footer .right {
        text-align: right;
      }
      .footer .right strong {
        color: #64748b;
      }
      
      .sales-section {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 10px 16px;
        margin: 8px 0 4px 0;
      }
      .sales-section .title {
        font-size: 9px;
        font-weight: 700;
        color: #166534;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .sales-section .row {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        font-size: 10px;
        border-bottom: 1px dashed #bbf7d0;
      }
      .sales-section .row:last-child {
        border-bottom: none;
      }
      .sales-section .label {
        color: #166534;
      }
      .sales-section .value {
        font-weight: 600;
        color: #0f172a;
      }
      
      @media print {
        body { margin: 0; padding: 0; background: white; }
        .payslip { box-shadow: none; border-radius: 0; }
        .no-print { display: none !important; }
        .header { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .net-salary { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .amount-table th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .attendance-item { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sales-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>

    <div class="payslip">
      <div class="header">
        <div class="header-left">
          <div class="logo-box">${logoHTML}</div>
        </div>
        <div class="header-right">
          <div class="title">PAYSLIP</div>
          <div class="period">${MONTHS[payroll.month]} ${payroll.year}</div>
        </div>
      </div>

      <div class="employee-info">
        <div class="emp-item"><span class="emp-label">Employee ID</span><span class="emp-value">${payroll.employee_code || "—"}</span></div>
        <div class="emp-item"><span class="emp-label">Name</span><span class="emp-value">${payroll.employee_name || "—"}</span></div>
        <div class="emp-item"><span class="emp-label">Department</span><span class="emp-value">${payroll.department || "—"}</span></div>
        <div class="emp-item"><span class="emp-label">Pay Period</span><span class="emp-value">${formatDate(payroll.pay_period_start)} - ${formatDate(payroll.pay_period_end)}</span></div>
        <div class="emp-item"><span class="emp-label">Issue Date</span><span class="emp-value">${formatDate(payroll.issue_date)}</span></div>
        <div class="emp-item"><span class="emp-label">Status</span><span class="emp-value"><span class="status-badge ${payroll.status}">${statusConfig[payroll.status]?.label || "Pending"}</span></span></div>
      </div>

      <div class="table-wrap">
        <div class="table-col">
          <div class="section-title"><span class="bar"></span>Earnings</div>
          <table class="amount-table">
            <thead><tr><th>Description</th><th class="text-right">Amount (PKR)</th></tr></thead>
            <tbody>
              <tr><td>Base Salary</td><td class="text-right">${formatNum(payroll.base_salary)}</td></tr>
              ${payroll.total_allowances > 0 ? `<tr><td>Total Allowances</td><td class="text-right">${formatNum(payroll.total_allowances)}</td></tr>` : ""}
              ${payroll.bonus > 0 ? `<tr><td>Bonus / Incentive</td><td class="text-right">${formatNum(payroll.bonus)}</td></tr>` : ""}
              ${payroll.adjustment !== 0 ? `<tr><td>Adjustment</td><td class="text-right ${payroll.adjustment > 0 ? "positive" : "negative"}">${payroll.adjustment > 0 ? "+" : ""}${formatNum(payroll.adjustment)}</td></tr>` : ""}
            </tbody>
            <tfoot>
              <tr class="total-row"><td>Gross Salary</td><td class="text-right">${formatNum(payroll.gross_salary)}</td></tr>
            </tfoot>
          </table>
          ${isSalesEmployee ? `
            <div class="sales-section">
              <div class="title">💰 Sales Commission</div>
              <div class="row"><span class="label">Net Sales (USD)</span><span class="value">${formatUSD(netSales)}</span></div>
              <div class="row"><span class="label">Commission Rate</span><span class="value">${commissionPercent}%</span></div>
              <div class="row"><span class="label">Conversion Rate</span><span class="value">Rs. ${formatNum(conversionRate)}/USD</span></div>
              <div class="row" style="font-weight:700;border-top:2px solid #bbf7d0;padding-top:4px;margin-top:2px;">
                <span class="label">Commission Amount (PKR)</span>
                <span class="value" style="color:#16a34a;">+ ${formatCurrency(commissionAmount)}</span>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="table-col">
          <div class="section-title"><span class="bar"></span>Deductions</div>
          <table class="amount-table">
            <thead><tr><th>Description</th><th class="text-right">Amount (PKR)</th></tr></thead>
            <tbody>
              ${payroll.absent_deduction > 0 ? `<tr><td>Absent (${payroll.absent_days} days)</td><td class="text-right negative">-${formatNum(payroll.absent_deduction)}</td></tr>` : ""}
              ${payroll.late_deduction > 0 ? `<tr><td>Late (${payroll.late_days} lates)</td><td class="text-right negative">-${formatNum(payroll.late_deduction)}</td></tr>` : ""}
              ${payroll.advance_deduction > 0 ? `<tr><td>Advance / Loan</td><td class="text-right negative">-${formatNum(payroll.advance_deduction)}</td></tr>` : ""}
              ${payroll.tax_deduction > 0 ? `<tr><td>Income Tax</td><td class="text-right negative">-${formatNum(payroll.tax_deduction)}</td></tr>` : ""}
              ${payroll.other_deduction > 0 ? `<tr><td>Other</td><td class="text-right negative">-${formatNum(payroll.other_deduction)}</td></tr>` : ""}
            </tbody>
            <tfoot>
              <tr class="total-row"><td>Total Deductions</td><td class="text-right negative">-${formatNum(payroll.total_deductions + (payroll.advance_deduction || 0) + (payroll.tax_deduction || 0) + (payroll.other_deduction || 0))}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="section-title"><span class="bar"></span>Attendance Summary</div>
      <div class="attendance-grid">
        <div class="attendance-item"><div class="num">${payroll.present_days || 0}</div><div class="lbl">Present</div></div>
        <div class="attendance-item"><div class="num">${payroll.absent_days || 0}</div><div class="lbl">Absent</div></div>
        <div class="attendance-item"><div class="num">${payroll.late_days || 0}</div><div class="lbl">Late</div></div>
        <div class="attendance-item"><div class="num">${payroll.leave_days || 0}</div><div class="lbl">Leave</div></div>
        <div class="attendance-item"><div class="num">${payroll.half_days || 0}</div><div class="lbl">Half Day</div></div>
      </div>

      <div class="net-salary">
        <div class="left">
          <div class="label">Net Salary</div>
          <div class="words">${numberToWords(Math.floor(payroll.net_salary))} Rupees Only</div>
        </div>
        <div class="amount"><span class="curr">PKR</span> ${formatNum(payroll.net_salary)}</div>
      </div>

      <div class="footer">
        <span>System-generated payslip · For discrepancies, contact HR</span>
        <div class="right">
          <strong>Digious Solutions</strong> · ${currentDate} · Confidential
        </div>
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank", "width=820,height=700");
  printWindow.document.write(`
    <html>
      <head>
        <title>Payslip - ${MONTHS[payroll.month]} ${payroll.year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #e2e8f0; 
            padding: 15px; 
            font-family: 'Segoe UI', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          @media print {
            body { background: white; padding: 0; display: block; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${pdfContent.innerHTML}
        <div class="no-print" style="text-align: center; margin-top: 12px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); max-width: 794px; margin-left: auto; margin-right: auto;">
          <button onclick="window.print();" style="padding: 8px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: 600; font-size: 13px;">
            🖨️ Print / PDF
          </button>
          <button onclick="window.close();" style="padding: 8px 24px; background: #f1f5f9; color: #475569; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
            ✕ Close
          </button>
          <p style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
            Press <strong>Ctrl+P</strong> → Save as PDF
          </p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ─── Updated PaySlip Modal with Sales Details ──────────────────────────
const PaySlipModal = ({ payroll, onClose }) => {
  if (!payroll) return null;

  const dailyRateNote = `${formatNum(payroll.base_salary)} ÷ 30 = ${formatNum(payroll.daily_rate)}/day`;
  const isSalesEmployee = payroll.department === "Sales" || payroll.department?.toLowerCase() === "sales";
  const commissionAmount = parseFloat(payroll.commission_amount_pkr) || 0;
  const netSales = parseFloat(payroll.net_sales) || 0;
  const commissionPercent = parseFloat(payroll.commission_percentage) || 0;
  const conversionRate = parseFloat(payroll.dollar_conversion_rate) || 280;

  const handleDownload = () => {
    generatePayslipPDF(payroll, companyLogo);
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

        <div className="p-6 space-y-5">
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

          {isSalesEmployee && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <TrendingUpIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Sales Employee</span> • Commission included
              </p>
            </div>
          )}

          {payroll.issue_date && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                <span className="font-medium">Expected Issue Date:</span>{" "}
                {formatDate(payroll.issue_date)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
            <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Daily Rate: <span className="font-semibold">{dailyRateNote}</span>{" "}
              (always ÷ 30 regardless of month length)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                
                {isSalesEmployee && commissionAmount > 0 && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex justify-between text-sm font-semibold text-emerald-800">
                      <span>💰 Sales Commission</span>
                      <span>+{formatCurrency(commissionAmount)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-emerald-700">
                      <div className="text-center">
                        <p className="font-medium">Net Sales</p>
                        <p className="font-bold">{formatUSD(netSales)}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Rate</p>
                        <p className="font-bold">{commissionPercent}%</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Conversion</p>
                        <p className="font-bold">Rs. {formatNum(conversionRate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                        ({payroll.absent_days}d ×{" "}
                        {formatNum(payroll.daily_rate)})
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
                        ({payroll.late_days} lates ={" "}
                        {payroll.late_deduction_days}d)
                      </span>
                    </span>
                    <span className="font-medium text-amber-600">
                      −{formatNum(payroll.late_deduction)}
                    </span>
                  </div>
                )}
                {(payroll.advance_deduction || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Advance / Loan Deduction
                    </span>
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
                  {isSalesEmployee && commissionAmount > 0 &&
                    ` + ${formatCurrency(commissionAmount)} commission`}
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
                {
                  label: "Present",
                  value: payroll.present_days || 0,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Absent",
                  value: payroll.absent_days || 0,
                  color: "text-rose-600",
                  bg: "bg-rose-50",
                },
                {
                  label: "Late",
                  value: payroll.late_days || 0,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Paid Leave",
                  value: payroll.leave_days || 0,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Half Day",
                  value: payroll.half_days || 0,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`text-center p-3 ${s.bg} rounded-lg`}
                >
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {payroll.bank_name && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Bank</p>
                  <p className="font-medium text-slate-800">
                    {payroll.bank_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Account</p>
                  <p className="font-medium text-slate-800">
                    {payroll.account_number}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Title</p>
                  <p className="font-medium text-slate-800">
                    {payroll.account_title_name}
                  </p>
                </div>
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

// ─── Main Employee Payroll Page ───────────────────────
const EmployeePayrollPage = () => {
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
      toast.error(
        "Failed to load payslip: " + (err.message || "Unknown error"),
      );
    } finally {
      setPayslipLoading(null);
    }
  };

  const latest = records[0] || null;
  const totalEarned = records
    .filter((r) => r.status === "success")
    .reduce((sum, r) => sum + r.net_salary, 0);
  const totalDeductions = records.reduce(
    (sum, r) => sum + r.total_deductions,
    0,
  );

  const isSalesEmployee = employee?.department === "Sales" || employee?.department?.toLowerCase() === "sales";

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
        {isSalesEmployee && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Sales Employee</p>
              <p className="text-xs text-emerald-600">Your payslip includes sales commission based on monthly performance</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Current Net Salary",
              value: latest ? formatCurrency(latest.net_salary) : "—",
              sub: latest
                ? `${MONTHS[latest.month]} ${latest.year}`
                : "No data",
              icon: BadgeDollarSign,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              label: "Base Salary",
              value: latest ? formatCurrency(latest.base_salary) : "—",
              sub: latest
                ? `Daily: PKR ${formatNum(latest.daily_rate)}`
                : "÷ 30",
              icon: Briefcase,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              label: "Total Paid",
              value: formatCurrency(totalEarned),
              sub: `${records.filter((r) => r.status === "success").length} payslip(s)`,
              icon: TrendingUp,
              iconBg: "bg-green-50",
              iconColor: "text-green-600",
            },
            {
              label: "Total Deductions",
              value: formatCurrency(totalDeductions),
              sub: "All time",
              icon: TrendingDown,
              iconBg: "bg-rose-50",
              iconColor: "text-rose-600",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-800">
                    {card.label}
                  </span>
                  <div className={`p-2 ${card.iconBg} rounded-lg`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600">{card.value}</p>
                <p className="text-xs text-blue-600 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

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
              <p className="text-slate-500 font-semibold">
                No Payroll Records Found
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Your payroll records will appear here once generated by admin.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pay Period
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Month Days
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Base Salary
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Allowances
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Bonus/Adj
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Net Salary
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => {
                      const isSales = r.department === "Sales" || r.department?.toLowerCase() === "sales";
                      const hasCommission = parseFloat(r.commission_amount_pkr) > 0;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {MONTHS[r.month]} {r.year}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {r.pay_period_start
                                ? `${formatDate(r.pay_period_start)} → ${formatDate(r.pay_period_end)}`
                                : `${r.month}/${r.year}`}
                            </p>
                            {isSales && hasCommission && (
                              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                + Commission
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">
                              {r.days_in_month || r.working_days || 30}d
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-medium text-slate-700">
                            {formatNum(r.base_salary)}
                          </td>
                          <td className="px-5 py-4 text-center text-emerald-600 font-medium">
                            +{formatNum(r.total_allowances)}
                          </td>
                          <td className="px-5 py-4 text-center text-rose-600 font-medium">
                            {r.total_deductions > 0 ? (
                              `−${formatNum(r.total_deductions)}`
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="space-y-0.5">
                              {(r.bonus || 0) > 0 && (
                                <span className="text-xs font-medium text-emerald-600 block">
                                  +{formatNum(r.bonus)}
                                </span>
                              )}
                              {(r.adjustment || 0) !== 0 && (
                                <span
                                  className={`text-xs font-medium block ${r.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}
                                >
                                  {r.adjustment > 0 ? "+" : ""}
                                  {formatNum(r.adjustment)}
                                </span>
                              )}
                              {isSales && parseFloat(r.commission_amount_pkr) > 0 && (
                                <span className="text-xs font-medium text-emerald-600 block">
                                  +{formatCurrency(r.commission_amount_pkr)} commission
                                </span>
                              )}
                              {!r.bonus && !r.adjustment && !(isSales && parseFloat(r.commission_amount_pkr) > 0) && (
                                <span className="text-slate-300">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <p className="font-bold text-blue-700">
                              {formatNum(r.net_salary)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                                P:{r.present_days}
                              </span>
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-medium">
                                A:{r.absent_days}
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                                L:{r.late_days}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-5 py-4 text-center text-xs text-slate-500">
                            {r.issue_date ? formatDate(r.issue_date) : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => viewPayslip(r)}
                              disabled={payslipLoading === r.id}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              {payslipLoading === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-slate-100">
                {records.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const isSales = r.department === "Sales" || r.department?.toLowerCase() === "sales";
                  const hasCommission = parseFloat(r.commission_amount_pkr) > 0;
                  return (
                    <div key={r.id} className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800">
                              {SHORT_MONTHS[r.month]} {r.year}
                            </p>
                            <StatusBadge status={r.status} />
                            {isSales && hasCommission && (
                              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                + Commission
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-blue-700 mt-0.5">
                            PKR {formatNum(r.net_salary)}
                          </p>
                          {r.issue_date && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Issue: {formatDate(r.issue_date)}
                            </p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Pay Period</span>
                            </div>
                            <div className="text-right text-slate-700 text-xs">
                              {r.pay_period_start
                                ? `${formatDate(r.pay_period_start)} → ${formatDate(r.pay_period_end)}`
                                : `${r.month}/${r.year}`}
                            </div>
                            <div>
                              <span className="text-slate-500">Days in Month</span>
                            </div>
                            <div className="text-right text-slate-700">
                              {r.days_in_month || r.working_days || 30}
                            </div>
                            <div>
                              <span className="text-slate-500">Base Salary</span>
                            </div>
                            <div className="text-right text-slate-700">
                              {formatNum(r.base_salary)}
                            </div>
                            <div>
                              <span className="text-slate-500">Allowances</span>
                            </div>
                            <div className="text-right text-emerald-600">
                              +{formatNum(r.total_allowances)}
                            </div>
                            <div>
                              <span className="text-slate-500">Deductions</span>
                            </div>
                            <div className="text-right text-rose-600">
                              −{formatNum(r.total_deductions)}
                            </div>
                            {(r.bonus || 0) > 0 && (
                              <>
                                <div>
                                  <span className="text-slate-500">Bonus</span>
                                </div>
                                <div className="text-right text-emerald-600">
                                  +{formatNum(r.bonus)}
                                </div>
                              </>
                            )}
                            {(r.adjustment || 0) !== 0 && (
                              <>
                                <div>
                                  <span className="text-slate-500">Adjustment</span>
                                </div>
                                <div
                                  className={`text-right ${r.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}
                                >
                                  {r.adjustment > 0 ? "+" : ""}
                                  {formatNum(r.adjustment)}
                                </div>
                              </>
                            )}
                            {isSales && hasCommission && (
                              <>
                                <div>
                                  <span className="text-slate-500">Commission</span>
                                </div>
                                <div className="text-right text-emerald-600">
                                  +{formatCurrency(r.commission_amount_pkr)}
                                </div>
                              </>
                            )}
                            <div>
                              <span className="text-slate-500">Attendance</span>
                            </div>
                            <div className="text-right text-slate-700">
                              P:{r.present_days} A:{r.absent_days} L:{r.late_days}
                            </div>
                            {isSales && (
                              <>
                                <div>
                                  <span className="text-slate-500">Net Sales</span>
                                </div>
                                <div className="text-right text-slate-700">
                                  ${formatNum(r.net_sales || 0)}
                                </div>
                                <div>
                                  <span className="text-slate-500">Commission Rate</span>
                                </div>
                                <div className="text-right text-slate-700">
                                  {r.commission_percentage || 0}%
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPayslip(r);
                            }}
                            disabled={payslipLoading === r.id}
                            className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            {payslipLoading === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
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

        {selectedPayslip && (
          <PaySlipModal
            payroll={selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
          />
        )}
      </div>
    </ProtectedModule>
  );
};

export default EmployeePayrollPage;