const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
require("dotenv").config();

// SMTP Transporter
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true",
  dnsTimeout: 5000,
  connectionTimeout: 30000,
  greetingTimeout: 7000,
  socketTimeout: 7000,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Invoice HTML generate karne ka function (frontend ke B&W template jaisa)
function buildInvoiceHtml(invoice) {
  const itemsHtml = (invoice.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${item.description || "Service"}</td>
        <td style="text-align:center;">${item.quantity || 1}</td>
        <td style="text-align:right;">PKR ${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="text-align:right;">PKR ${(
          (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
        ).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const total = Number(invoice.total_amount) || 0;
  const paid = Number(invoice.paid_amount) || 0;
  const balance = Math.max(0, total - paid);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
      .company h1 { font-size: 18px; margin: 0 0 4px 0; }
      .company p { margin: 2px 0; font-size: 9.5px; }
      .title h2 { font-size: 26px; letter-spacing: 3px; margin: 0; text-align: right; }
      .info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
      .box { border: 1px solid #000; padding: 10px 12px; }
      .box h3 { font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 6px 0; }
      table.items { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
      table.items th { background: #000; color: #fff; padding: 7px 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #000; }
      table.items td { padding: 6px 8px; border: 1px solid #000; font-size: 10.5px; }
      table.totals { width: 55%; margin-left: auto; border-collapse: collapse; margin-bottom: 14px; }
      table.totals td { padding: 5px 8px; border: 1px solid #000; font-size: 10.5px; }
      table.totals .grand td { background: #000; color: #fff; font-weight: 800; font-size: 13px; }
      .bank { border: 1.5px solid #000; padding: 10px 12px; margin-bottom: 14px; }
      .bank h3 { font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 6px 0; }
      .bank p { margin: 3px 0; font-size: 10px; }
      .notice { text-align: center; border: 1px dashed #000; padding: 6px; font-size: 9px; font-style: italic; margin-bottom: 12px; }
      .footer { border-top: 2px solid #000; padding-top: 8px; text-align: center; font-size: 9px; }
      .footer .thanks { font-size: 11px; font-weight: 700; margin-bottom: 3px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="company">
        <h1>Digious Solutions</h1>
        <p>B-71 Block B, North Nazimabad, Karachi</p>
        <p>Phone: (+92) 33 127 38475</p>
        <p>Email: ${process.env.COMPANY_EMAIL}</p>
      </div>
      <div class="title">
        <h2>INVOICE</h2>
        <p>#${invoice.invoice_number}</p>
      </div>
    </div>

    <div class="info">
      <div class="box">
        <h3>Bill To</h3>
        <p><strong>${invoice.client_name}</strong></p>
        <p>${invoice.client_email || ""}</p>
        ${invoice.client_phone ? `<p>${invoice.client_phone}</p>` : ""}
        ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ""}
      </div>
      <div class="box">
        <h3>Invoice Details</h3>
        <p><strong>Issue Date:</strong> ${invoice.issue_date || "-"}</p>
        <p><strong>Due Date:</strong> ${invoice.due_date || "-"}</p>
        <p><strong>Project:</strong> ${invoice.project_title || "-"}</p>
        <p><strong>Status:</strong> ${invoice.status || "-"}</p>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:5%;">#</th>
          <th>Description</th>
          <th style="width:12%;">Qty</th>
          <th style="width:20%;">Unit Price</th>
          <th style="width:20%;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table class="totals">
      <tr class="grand">
        <td style="width:55%; background:#000; color:#fff; font-weight:800;">Total</td>
        <td style="text-align:right; background:#000; color:#fff;">PKR ${total.toFixed(2)}</td>
      </tr>
      ${invoice.status === "Partially Paid"
      ? `
      <tr>
        <td>Amount Paid</td>
        <td style="text-align:right;">PKR ${paid.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="background:#e8e8e8; font-weight:800;">Balance Due</td>
        <td style="text-align:right; background:#e8e8e8; font-weight:800;">PKR ${balance.toFixed(2)}</td>
      </tr>`
      : ""
    }
    </table>

    <div class="bank">
      <h3>Payment / Bank Details</h3>
      <p><strong>Bank:</strong> Meezan Bank</p>
      <p><strong>Account Title:</strong> DIGIOUS SOLUTIONS</p>
      <p><strong>Account Number:</strong> 99060107878756</p>
      <p><strong>IBAN:</strong> PK49MEZN0099060107878756</p>
    </div>

    <div class="notice">
      This is a computer generated invoice and does not require a signature.
    </div>

    <div class="footer">
      <div class="thanks">Thank you for your business!</div>
      <p>For queries, contact ${process.env.COMPANY_EMAIL} | (+92) 33 127 38475</p>
      <p>Please quote invoice #${invoice.invoice_number} in your payment reference.</p>
      <p>&copy; ${new Date().getFullYear()} Digious Solutions. All rights reserved.</p>
    </div>
  </body>
  </html>`;
}

// Invoice ko PDF Buffer mein convert karein
async function generateInvoicePdf(invoice) {
  const html = buildInvoiceHtml(invoice);
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
  return pdfBuffer;
}

// Main function: Invoice email bhejein
async function sendInvoiceEmail(invoice) {
  // 1. PDF generate karein (Buffer milta hai)
  const pdfBuffer = await generateInvoicePdf(invoice);

  // 2. Email bhejein (PDF attachment ke saath)
  // Nodemailer Buffer content ko directly accept karta hai [citation:1]
  const mailOptions = {
    from: `"Digious Solutions" <${process.env.SMTP_EMAIL}>`,
    to: invoice.client_email,
    subject: `Invoice #${invoice.invoice_number} from Digious Solutions`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Invoice #${invoice.invoice_number}</h2>
        <p>Dear ${invoice.client_name},</p>
        <p>Please find attached invoice <strong>#${invoice.invoice_number}</strong> for <strong>${invoice.project_title || "our services"}</strong>.</p>
        <table style="margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 4px 0;"><strong>Amount:</strong></td><td>PKR ${(Number(invoice.total_amount) || 0).toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Due Date:</strong></td><td>${invoice.due_date || "-"}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Status:</strong></td><td>${invoice.status || "-"}</td></tr>
        </table>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 8px 0;"><strong>Bank Details:</strong></p>
          <p style="margin: 2px 0;">Meezan Bank</p>
          <p style="margin: 2px 0;">Account Title: DIGIOUS SOLUTIONS</p>
          <p style="margin: 2px 0;">Account #: 99060107878756</p>
          <p style="margin: 2px 0;">IBAN: PK49MEZN0099060107878756</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">This is a computer generated invoice and does not require a signature.</p>
        <p>Regards,<br/><strong>Digious Solutions</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `Invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer, // Buffer accepted by Nodemailer [citation:1]
        contentType: "application/pdf",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendInvoiceEmail };