import { getSupabaseServer } from '@/lib/supabase-server';

// Strict interface based on database schema
interface RFQItem {
  id: string;
  contact_name: string;
  contact_company: string | null; // e.g., "Metro Steelworks", might be null
  project_description: string; // Detailed text
  quantity: number;
  material: string | null; // e.g., "A572 Grade 50", "SS304"
  deadline: string | null; // ISO Date String "2025-12-15"
  budget: string | null; // Free text, e.g., "USD 18k - 22k"
  status: 'pending' | 'reviewed' | 'quoted' | 'rejected';
  created_at: string;
}

interface RFQReportData {
  period: string;
  totalInquiries: number;
  actionRequired: number;
  conversionRate: string; // Formatted to 1 decimal place
  topMaterial: string;
  urgentList: RFQItem[];
  materialBreakdown: { material: string; count: number }[];
  items: RFQItem[];
}

export class RFQReportService {
  static async generateRFQReport(period: string): Promise<RFQReportData> {
    const supabase = await getSupabaseServer();
    
    try {
      // Fetch all RFQ items from database
      const { data: rfqItems, error } = await supabase
        .from('rfq_submissions')
        .select(`
          id,
          contact_name,
          contact_company,
          project_description,
          quantity,
          material,
          deadline,
          budget,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch RFQ items: ${error.message}`);
      }

      const items: RFQItem[] = (rfqItems || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'reviewed' | 'quoted' | 'rejected',
        contact_name: item.contact_name || '',
        project_description: item.project_description || '',
        quantity: item.quantity || 0,
        created_at: item.created_at || new Date().toISOString()
      }));
      
      // Calculate business logic statistics
      const totalInquiries = items.length;
      const actionRequired = items.filter(item => item.status === 'pending').length;
      const quotedCount = items.filter(item => item.status === 'quoted').length;
      const conversionRate = totalInquiries > 0 ? ((quotedCount / totalInquiries) * 100).toFixed(1) : '0.0';
      
      // Find top material (most frequent)
      const materialCounts = new Map<string, number>();
      items.forEach(item => {
        if (item.material) {
          const current = materialCounts.get(item.material) || 0;
          materialCounts.set(item.material, current + 1);
        }
      });
      
      const topMaterial = materialCounts.size > 0 
        ? Array.from(materialCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';
      
      // Generate urgent list (pending items with deadlines, sorted by date ascending, top 5)
      const urgentList = items
        .filter(item => item.status === 'pending' && item.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5);
      
      // Material breakdown
      const materialBreakdown = Array.from(materialCounts.entries())
        .map(([material, count]) => ({ material, count }))
        .sort((a, b) => b.count - a.count);

      return {
        period,
        totalInquiries,
        actionRequired,
        conversionRate,
        topMaterial,
        urgentList,
        materialBreakdown,
        items
      };

    } catch (error) {
      console.error('Error generating RFQ report:', error);
      throw error;
    }
  }

  static async generateRFQReportPDF(reportData: RFQReportData): Promise<Buffer> {
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Color palette
      const colors = {
        brandNavy: [26, 60, 94] as [number, number, number],
        darkGrey: [44, 62, 80] as [number, number, number],
        lightGrey: [245, 245, 245] as [number, number, number],
        pending: [230, 126, 34] as [number, number, number],
        quoted: [39, 174, 96] as [number, number, number],
        reviewed: [41, 128, 185] as [number, number, number],
        rejected: [231, 76, 60] as [number, number, number]
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number = 20) => {
        if (yPosition + requiredSpace > 270) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Section 1: Header (Two-column layout)
      doc.setTextColor(...colors.brandNavy);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('STEELSMART INC.', margin, yPosition);
      
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sales & RFQ Performance', margin, yPosition + 6);
      
      // Right side - Period and Generated date
      const rightX = pageWidth - margin - 60;
      doc.text(`Period: ${reportData.period}`, rightX, yPosition);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, rightX, yPosition + 6);
      
      // Thick horizontal line under header
      yPosition += 15;
      doc.setDrawColor(...colors.brandNavy);
      doc.setLineWidth(2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Section 2: KPI Cards (Executive Summary) - 4-column table
      checkNewPage(40);
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', margin, yPosition);
      yPosition += 10;

      const cardWidth = contentWidth / 4;
      const cardHeaders = ['TOTAL INQUIRIES', 'ACTION REQUIRED', 'CONVERSION RATE', 'TOP MATERIAL'];
      const cardValues = [
        reportData.totalInquiries.toString(),
        reportData.actionRequired.toString(),
        `${reportData.conversionRate}%`,
        reportData.topMaterial
      ];

      // Draw KPI cards
      for (let i = 0; i < 4; i++) {
        const x = margin + (i * cardWidth);
        
        // Header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.darkGrey);
        doc.text(cardHeaders[i], x + 2, yPosition + 5, { maxWidth: cardWidth - 4 });
        
        // Value - Set color to red if Action Required > 0
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        if (i === 1 && reportData.actionRequired > 0) {
          doc.setTextColor(231, 76, 60); // Red for action required
        } else {
          doc.setTextColor(...colors.brandNavy);
        }
        doc.text(cardValues[i], x + 2, yPosition + 15, { maxWidth: cardWidth - 4 });
        
        // Card border
        doc.setDrawColor(...colors.lightGrey);
        doc.setLineWidth(0.5);
        doc.rect(x, yPosition, cardWidth, 20);
      }
      yPosition += 30;

      // Section 3: Urgent Attention (Conditional)
      if (reportData.urgentList.length > 0) {
        checkNewPage(60);
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('URGENT ATTENTION', margin, yPosition);
        yPosition += 10;

        // Table headers
        const urgentHeaders = ['Due Date', 'Client', 'Scope', 'Material', 'Status'];
        const urgentColWidths = [25, 35, 60, 30, 20];
        
        // Header row
        doc.setFillColor(...colors.darkGrey);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let currentX = margin;
        urgentHeaders.forEach((header, i) => {
          doc.text(header, currentX + 2, yPosition + 5);
          currentX += urgentColWidths[i];
        });
        yPosition += 8;

        // Data rows
        reportData.urgentList.forEach((item, index) => {
          checkNewPage(8);
          
          // Zebra striping
          if (index % 2 === 0) {
            doc.setFillColor(...colors.lightGrey);
            doc.rect(margin, yPosition, contentWidth, 8, 'F');
          }
          
          doc.setTextColor(...colors.darkGrey);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          
          currentX = margin;
          const rowData = [
            item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A',
            item.contact_company || item.contact_name,
            item.project_description.length > 40 ? item.project_description.substring(0, 40) + '...' : item.project_description,
            item.material || 'N/A',
            item.status.toUpperCase()
          ];
          
          rowData.forEach((data, i) => {
            // Status column coloring
            if (i === 4) {
              switch (item.status) {
                case 'pending':
                  doc.setTextColor(...colors.pending);
                  break;
                case 'quoted':
                  doc.setTextColor(...colors.quoted);
                  break;
                case 'reviewed':
                  doc.setTextColor(...colors.reviewed);
                  break;
                default:
                  doc.setTextColor(...colors.darkGrey);
              }
            }
            
            doc.text(data, currentX + 2, yPosition + 5, { maxWidth: urgentColWidths[i] - 4 });
            currentX += urgentColWidths[i];
            
            // Reset color
            doc.setTextColor(...colors.darkGrey);
          });
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Section 4: Material Demand Analysis
      if (reportData.materialBreakdown.length > 0) {
        checkNewPage(40);
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MATERIAL DEMAND ANALYSIS', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        reportData.materialBreakdown.forEach(({ material, count }) => {
          checkNewPage(6);
          doc.text(`• ${material}: ${count}`, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Section 5: Transaction Log (Main Data)
      checkNewPage(60);
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION LOG', margin, yPosition);
      yPosition += 10;

      // Table headers
      const logHeaders = ['Date', 'Client', 'Description', 'Budget', 'Status'];
      const logColWidths = [25, 35, 70, 25, 15];
      
      // Header row
      doc.setFillColor(...colors.darkGrey);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let currentX = margin;
      logHeaders.forEach((header, i) => {
        doc.text(header, currentX + 2, yPosition + 5);
        currentX += logColWidths[i];
      });
      yPosition += 8;

      // Data rows
      reportData.items.forEach((item, index) => {
        checkNewPage(8);
        
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(...colors.lightGrey);
          doc.rect(margin, yPosition, contentWidth, 8, 'F');
        }
        
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        currentX = margin;
        const rowData = [
          new Date(item.created_at).toLocaleDateString(),
          item.contact_company || item.contact_name,
          item.project_description.length > 50 ? item.project_description.substring(0, 50) + '...' : item.project_description,
          item.budget || 'N/A',
          item.status.toUpperCase()
        ];
        
        rowData.forEach((data, i) => {
          // Status column coloring
          if (i === 4) {
            switch (item.status) {
              case 'pending':
                doc.setTextColor(...colors.pending);
                break;
              case 'quoted':
                doc.setTextColor(...colors.quoted);
                break;
              case 'reviewed':
                doc.setTextColor(...colors.reviewed);
                break;
              case 'rejected':
                doc.setTextColor(...colors.rejected);
                break;
              default:
                doc.setTextColor(...colors.darkGrey);
            }
          }
          
          doc.text(data, currentX + 2, yPosition + 5, { maxWidth: logColWidths[i] - 4 });
          currentX += logColWidths[i];
          
          // Reset color
          doc.setTextColor(...colors.darkGrey);
        });
        yPosition += 8;
      });

      // Footer
      yPosition += 20;
      doc.setFontSize(8);
      doc.setTextColor(...colors.darkGrey);
      doc.text('Generated by SteelSmart Admin System', margin, yPosition);
      doc.text(`© ${new Date().getFullYear()} SteelSmart Inc. All rights reserved.`, margin, yPosition + 4);

      // Convert to buffer
      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      
      return pdfBuffer;
      
    } catch (error) {
      throw error;
    }
  }
}