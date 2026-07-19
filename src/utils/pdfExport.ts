import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import type { Warehouse, InventoryItem } from '@/types/inventory';

export function downloadInventoryPdf(warehouse: Warehouse, items: InventoryItem[], agencyName: string | null = 'Spiceflow') {
  // Initialize jsPDF (portrait, millimeters, A4 size)
  const doc = new jsPDF('p', 'mm', 'a4');

  // Title
  doc.setFontSize(18);
  doc.setTextColor(15, 157, 108); // Primary color
  doc.text(`${agencyName || 'Spiceflow'} - Inventory Report`, 14, 22);

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Warehouse: ${warehouse.name}`, 14, 30);
  doc.text(`Type: ${warehouse.storeType}`, 14, 36);
  if (warehouse.location) {
    doc.text(`Location: ${warehouse.location}`, 14, 42);
  }
  doc.text(`Date generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 14, warehouse.location ? 48 : 42);

  // Summary Metrics
  const totalProducts = items.length;
  const totalUnits = items.reduce((acc, item) => acc + item.quantityAvailable, 0);
  const totalValue = items.reduce((acc, item) => acc + (item.quantityAvailable * (item.productBasePrice || 0)), 0);

  // Prepare table data
  const tableData = items.map(item => {
    const total = item.quantityAvailable;
    const perBox = item.soldUnitsPerBox || 0;
    const perUnit = item.itemsPerSoldUnit || 0;
    
    let boxes = '-';
    let bundles = '-';
    let loose = '-';

    if (perBox > 0 && perUnit > 0) {
      const itemsPerBox = perBox * perUnit;
      boxes = Math.floor(total / itemsPerBox).toString();
    }
    
    let remainder = total;
    if (perBox > 0 && perUnit > 0) {
      const itemsPerBox = perBox * perUnit;
      remainder = total % itemsPerBox;
    }

    if (perUnit > 0) {
      bundles = Math.floor(remainder / perUnit).toString();
      loose = (total % perUnit).toString();
    }

    const estValue = total * (item.productBasePrice || 0);

    return [
      item.productSku || 'N/A',
      item.productName,
      boxes,
      bundles,
      loose,
      total.toString(),
      `Rs. ${estValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  // Render Table
  autoTable(doc, {
    startY: warehouse.location ? 56 : 50,
    head: [['SKU', 'Product', 'Boxes', 'Bundles', 'Loose', 'Total Qty', 'Est. Value']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 157, 108] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' }
    }
  });

  // Footer / Summary below table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text('Summary', 14, finalY + 10);
  
  doc.setFontSize(10);
  doc.text(`Total Products: ${totalProducts}`, 14, finalY + 16);
  doc.text(`Total Units: ${totalUnits}`, 14, finalY + 22);
  doc.text(`Estimated Value: Rs. ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 28);

  // Save the PDF
  doc.save(`Inventory_${warehouse.name.replace(/[^a-z0-9]/gi, '_')}_${dayjs().format('YYYYMMDD')}.pdf`);
}
