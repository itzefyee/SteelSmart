export class PDFGeneratorService {
  static async generatePDFFromStream(doc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      doc.end();
    });
  }

  static createDocument(options?: {
    size?: 'A4' | 'LETTER';
    margins?: { top: number; bottom: number; left: number; right: number };
  }): any {
    try {
      // Import PDFDocument dynamically to avoid font file issues
      const PDFDocument = require('pdfkit');
      
      const doc = new PDFDocument({
        size: options?.size || 'A4',
        margins: options?.margins || {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        bufferPages: true,
        autoFirstPage: true
      });
      
      return doc;
    } catch (error) {
      console.error('Error creating PDF document:', error);
      throw error;
    }
  }

  // Helper methods for consistent styling
  static addHeader(
    doc: any,
    title: string,
    reportMeta: { date: string; id: string; period: string }
  ) {
    const pageWidth = doc.page.width;
    const leftMargin = doc.page.margins.left;
    const rightMargin = doc.page.margins.right;
    
    // Left side - Company branding
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('SteelSmart', leftMargin, 50);
    
    doc.fontSize(10)
       .fillColor('#64748b')
       .text('AI-Enhanced Metal & Steel Parts Marketplace', leftMargin, 78);
    
    // Right side - Report details
    const rightX = pageWidth - rightMargin - 250;
    
    doc.fontSize(16)
       .fillColor('#1e293b')
       .text(title, rightX, 50, { width: 250, align: 'right' });
    
    doc.fontSize(9)
       .fillColor('#64748b')
       .text(`Generated: ${reportMeta.date}`, rightX, 72, { width: 250, align: 'right' })
       .text(`Report ID: ${reportMeta.id}`, rightX, 84, { width: 250, align: 'right' })
       .text(`Period: ${reportMeta.period}`, rightX, 96, { width: 250, align: 'right' });
    
    // Horizontal line separator
    doc.strokeColor('#2563eb')
       .lineWidth(3)
       .moveTo(leftMargin, 120)
       .lineTo(pageWidth - rightMargin, 120)
       .stroke();
    
    return 130; // Return Y position after header
  }

  static addSectionTitle(doc: any, title: string, y: number): number {
    doc.fontSize(14)
       .fillColor('#1e293b')
       .text(title, doc.page.margins.left, y);
    
    // Underline
    const textWidth = doc.widthOfString(title);
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(doc.page.margins.left, y + 18)
       .lineTo(doc.page.margins.left + textWidth, y + 18)
       .stroke();
    
    return y + 30;
  }

  static addSummaryCard(
    doc: any,
    x: number,
    y: number,
    width: number,
    value: string,
    label: string,
    color: string = '#2563eb'
  ) {
    // Card background
    doc.rect(x, y, width, 60)
       .fillAndStroke('#f8fafc', '#e2e8f0');
    
    // Value
    doc.fontSize(20)
       .fillColor(color)
       .text(value, x, y + 15, { width, align: 'center' });
    
    // Label
    doc.fontSize(9)
       .fillColor('#64748b')
       .text(label.toUpperCase(), x, y + 40, { width, align: 'center' });
  }

  static addTable(
    doc: any,
    y: number,
    headers: string[],
    rows: string[][],
    columnWidths: number[]
  ): number {
    const leftMargin = doc.page.margins.left;
    const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    let currentY = y;
    
    // Header row
    doc.rect(leftMargin, currentY, tableWidth, 25)
       .fill('#f1f5f9');
    
    let currentX = leftMargin;
    headers.forEach((header, i) => {
      doc.fontSize(10)
         .fillColor('#1e293b')
         .text(header, currentX + 5, currentY + 8, {
           width: columnWidths[i] - 10,
           align: 'left'
         });
      currentX += columnWidths[i];
    });
    
    currentY += 25;
    
    // Data rows
    rows.forEach((row, rowIndex) => {
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.rect(leftMargin, currentY, tableWidth, 20)
           .fill('#ffffff');
      } else {
        doc.rect(leftMargin, currentY, tableWidth, 20)
           .fill('#f8fafc');
      }
      
      currentX = leftMargin;
      row.forEach((cell, i) => {
        doc.fontSize(9)
           .fillColor('#1e293b')
           .text(cell, currentX + 5, currentY + 6, {
             width: columnWidths[i] - 10,
             align: 'left'
           });
        currentX += columnWidths[i];
      });
      
      currentY += 20;
      
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
    });
    
    return currentY + 10;
  }

  static addFooter(doc: any, reportId: string, date: string) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      const bottomY = doc.page.height - 40;
      
      // Footer line
      doc.strokeColor('#e2e8f0')
         .lineWidth(1)
         .moveTo(doc.page.margins.left, bottomY - 10)
         .lineTo(doc.page.width - doc.page.margins.right, bottomY - 10)
         .stroke();
      
      // Footer text
      doc.fontSize(8)
         .fillColor('#64748b')
         .text(
           'This report was automatically generated by SteelSmart Admin System',
           doc.page.margins.left,
           bottomY,
           { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' }
         );
      
      doc.text(
        `Report ID: ${reportId} | Generated: ${date} | Page ${i + 1} of ${pageCount}`,
        doc.page.margins.left,
        bottomY + 12,
        { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' }
      );
      
      doc.text(
        `© ${new Date().getFullYear()} SteelSmart. All rights reserved.`,
        doc.page.margins.left,
        bottomY + 24,
        { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' }
      );
    }
  }
}