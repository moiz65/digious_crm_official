// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Standard PDF Layout Template
 * Can be used across the entire project
 */
export const PDFTemplate = {
  // Page settings
  pageFormat: 'a4',
  orientation: 'landscape', // or 'portrait'
  margins: {
    top: 20,
    right: 15,
    bottom: 20,
    left: 15
  },
  
  // Colors
  colors: {
    primary: [33, 150, 243], // Blue
    secondary: [76, 175, 80], // Green
    danger: [244, 67, 54], // Red
    text: [33, 33, 33], // Dark gray
    lightText: [117, 117, 117], // Light gray
    headerBg: [248, 249, 250], // Light background
    borderColor: [224, 224, 224] // Border
  },
  
  // Fonts
  fonts: {
    title: { size: 18, weight: 'bold' },
    subtitle: { size: 14, weight: 'bold' },
    heading: { size: 11, weight: 'bold' },
    body: { size: 10, weight: 'normal' },
    small: { size: 9, weight: 'normal' }
  }
};

/**
 * Generate PDF with standard header and footer
 * @param {string} title - Document title
 * @param {string} subtitle - Document subtitle
 * @param {array} columns - Column definitions [{key, label, width}]
 * @param {array} data - Data rows
 * @param {string} filename - Output filename
 */
export const generateTablePDF = (title, subtitle, columns, data, filename) => {
  const doc = new jsPDF(PDFTemplate.orientation, 'mm', PDFTemplate.pageFormat);
  const { margins, colors, fonts } = PDFTemplate;
  
  let yPosition = margins.top;
  
  // Add header
  yPosition = addHeader(doc, title, subtitle, yPosition);
  
  // Add company info
  yPosition = addCompanyInfo(doc, yPosition);
  
  // Add date
  yPosition = addDateInfo(doc, yPosition);
  
  // Add table
  yPosition = addDataTable(doc, columns, data, yPosition);
  
  // Add footer
  addFooter(doc);
  
  // Save PDF
  doc.save(filename);
};

/**
 * Add header to PDF
 */
const addHeader = (doc, title, subtitle, yPos) => {
  const { margins, colors, fonts } = PDFTemplate;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(fonts.title.size);
  doc.setFont(undefined, fonts.title.weight);
  doc.setTextColor(...colors.primary);
  doc.text(title, margins.left, yPos);
  
  yPos += 8;
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(fonts.subtitle.size);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.lightText);
    doc.text(subtitle, margins.left, yPos);
    yPos += 8;
  }
  
  // Horizontal line
  doc.setDrawColor(...colors.borderColor);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  
  return yPos + 10;
};

/**
 * Add company information
 */
const addCompanyInfo = (doc, yPos) => {
  const { margins, colors, fonts } = PDFTemplate;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(fonts.small.size);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.text);
  doc.text('Digious Solutions', margins.left, yPos);
  
  yPos += 4;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.lightText);
  doc.text('Employee Management System', margins.left, yPos);
  
  return yPos + 6;
};

/**
 * Add date information
 */
const addDateInfo = (doc, yPos) => {
  const { margins, colors, fonts } = PDFTemplate;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.setFontSize(fonts.small.size);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.lightText);
  doc.text(`Generated: ${exportDate}`, pageWidth - margins.right - 50, yPos);
  
  return yPos + 6;
};

/**
 * Add data table to PDF
 */
const addDataTable = (doc, columns, data, yPos) => {
  const { margins, colors, fonts } = PDFTemplate;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;
  
  // Calculate column widths
  const availableWidth = pageWidth - margins.left - margins.right;
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 20), 0);
  const scale = availableWidth / totalWidth;
  
  let currentY = yPos;
  
  // Header row
  doc.setFillColor(...colors.primary); // Use primary color (blue) instead of light gray
  doc.setFont(undefined, fonts.heading.weight);
  doc.setFontSize(fonts.heading.size);
  doc.setTextColor(255, 255, 255); // White text for contrast
  
  let currentX = margins.left;
  const headerHeight = 10; // Increased from 8 to 10
  
  // Draw header cells
  columns.forEach((col) => {
    const colWidth = (col.width || 20) * scale;
    // Draw blue background
    doc.setFillColor(...colors.primary);
    doc.rect(currentX, currentY, colWidth, headerHeight, 'F');
    // Draw border
    doc.setDrawColor(...colors.borderColor);
    doc.rect(currentX, currentY, colWidth, headerHeight);
    // Set text color and draw text
    doc.setTextColor(255, 255, 255); // Ensure white text
    doc.setFont(undefined, fonts.heading.weight);
    doc.text(col.label, currentX + 2, currentY + headerHeight - 3);
    currentX += colWidth;
  });
  
  currentY += headerHeight;
  
  // Data rows
  doc.setFont(undefined, fonts.body.weight);
  doc.setFontSize(fonts.body.size);
  doc.setTextColor(...colors.text);
  
  const rowHeight = 8;
  
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = margins.top;
      
      // Repeat header on new page
      doc.setFillColor(...colors.primary); // Use primary color (blue)
      doc.setFont(undefined, fonts.heading.weight);
      doc.setFontSize(fonts.heading.size);
      doc.setTextColor(255, 255, 255); // White text for contrast
      
      currentX = margins.left;
      const headerHeight = 10; // Match main header height
      columns.forEach((col) => {
        const colWidth = (col.width || 20) * scale;
        // Draw blue background
        doc.setFillColor(...colors.primary);
        doc.rect(currentX, currentY, colWidth, headerHeight, 'F');
        // Draw border
        doc.setDrawColor(...colors.borderColor);
        doc.rect(currentX, currentY, colWidth, headerHeight);
        // Set text color and draw text
        doc.setTextColor(255, 255, 255); // Ensure white text
        doc.setFont(undefined, fonts.heading.weight);
        doc.text(col.label, currentX + 2, currentY + headerHeight - 3);
        currentX += colWidth;
      });
      
      currentY += headerHeight;
      doc.setFont(undefined, fonts.body.weight);
      doc.setFontSize(fonts.body.size);
      doc.setTextColor(...colors.text);
    }
    
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margins.left, currentY, availableWidth, rowHeight, 'F');
    }
    
    // Draw row borders
    doc.setDrawColor(...colors.borderColor);
    currentX = margins.left;
    columns.forEach((col) => {
      const colWidth = (col.width || 20) * scale;
      doc.rect(currentX, currentY, colWidth, rowHeight);
      
      // Add cell content
      const cellValue = row[col.key] || '-';
      const displayValue = typeof cellValue === 'object' ? JSON.stringify(cellValue) : String(cellValue);
      
      // Truncate long text
      const maxLength = Math.floor(colWidth / 2);
      const displayText = displayValue.length > maxLength 
        ? displayValue.substring(0, maxLength - 3) + '...' 
        : displayValue;
      
      doc.text(displayText, currentX + 2, currentY + 6);
      currentX += colWidth;
    });
    
    currentY += rowHeight;
  });
  
  return currentY;
};

/**
 * Add footer to PDF
 */
const addFooter = (doc) => {
  const { margins, colors, fonts } = PDFTemplate;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = doc.internal.pages.length;
  
  doc.setFontSize(fonts.small.size);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.lightText);
  
  // Footer line
  doc.setDrawColor(...colors.borderColor);
  doc.line(margins.left, pageHeight - margins.bottom - 8, pageWidth - margins.right, pageHeight - margins.bottom - 8);
  
  // Page number
  doc.text(`Page ${pageNumber}`, pageWidth - margins.right - 15, pageHeight - margins.bottom + 2);
  
  // Company footer
  doc.setFontSize(8);
  doc.text('Digious Solutions - Employee Management System', margins.left, pageHeight - margins.bottom + 2);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (columns, data, filename) => {
  // Create header
  const header = columns.map(col => col.label).join(',');
  
  // Create rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escapedValue = String(value).replace(/"/g, '""');
      return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
    }).join(',');
  });
  
  // Combine
  const csv = [header, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel-style format
 */
export const exportToExcel = (columns, data, filename) => {
  // For now, use CSV export (can be enhanced with xlsx library later)
  exportToCSV(columns, data, filename);
};
