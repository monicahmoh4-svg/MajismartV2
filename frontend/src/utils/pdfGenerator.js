import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// MajiSmart brand colors
const COLORS = {
  primary: [8, 145, 178],      // Cyan
  secondary: [6, 182, 212],    // Lighter cyan
  dark: [15, 23, 42],          // Slate 900
  text: [71, 85, 105],         // Slate 600
  light: [248, 250, 252],      // Slate 50
  success: [16, 185, 129],     // Green
  warning: [245, 158, 11],     // Amber
  danger: [239, 68, 68],       // Red
  purple: [139, 92, 246]       // Purple
}

// MajiSmart logo as SVG (water drop)
const LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwZWE1ZTkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwNmI2ZDQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0idXJsKCNnKSIgcng9IjEwMCIvPjxwYXRoIGQ9Ik0yNTYgODAgQzI1NiA4MCAxMjAgMjQwIDEyMCAzMjAgQTEzNiAxMzYgMCAwIDAgMzkyIDMyMCBDMzkyIDI0MCAyNTYgODAgMjU2IDgwIFoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4='

// Add header to every page
function addPageHeader(doc, title, subtitle) {
  const pw = doc.internal.pageSize.getWidth()
  
  // Header bar
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pw, 35, 'F')
  
  // Logo
  try {
    doc.addImage(LOGO_SVG, 'SVG', 12, 6, 22, 22)
  } catch (e) {
    console.warn('Logo embedding failed')
  }
  
  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 40, 16)
  
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 40, 24)
  }
  
  // Date on right
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString('en-KE')}`, pw - 12, 24, { align: 'right' })
}

// Add footer to every page
function addPageFooter(doc) {
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()
  
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...COLORS.dark)
    doc.rect(0, ph - 12, pw, 12, 'F')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(7)
    doc.text('MajiSmart Kenya • Enterprise Asset Management', 12, ph - 4)
    doc.text(`Page ${i} of ${pages}`, pw - 12, ph - 4, { align: 'right' })
    doc.text('Confidential', pw / 2, ph - 4, { align: 'center' })
  }
}

// ============================================
// GENERAL ASSET REPORT
// ============================================
export async function generateAssetReport(assets, stats) {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  
  addPageHeader(doc, 'Asset Management Report', 'Enterprise Infrastructure Overview')
  
  let y = 50
  
  // Executive Summary
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', 12, y)
  y += 2
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(12, y, pw - 12, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.text)
  doc.text(
    `This report provides a comprehensive overview of MajiSmart's water infrastructure assets. The system currently manages ${stats?.total_assets || assets.length} assets across Kenya's water utility network.`,
    12, y, { maxWidth: pw - 24 }
  )
  y += 15
  
  // Key Metrics Boxes
  const metrics = [
    { label: 'Total Assets', value: stats?.total_assets || assets.length, color: COLORS.primary },
    { label: 'Active', value: stats?.active || 0, color: COLORS.success },
    { label: 'Critical', value: stats?.critical_condition || 0, color: COLORS.danger },
    { label: 'Overdue Maint.', value: stats?.overdue_maintenance || 0, color: COLORS.warning }
  ]
  
  const boxW = (pw - 36) / 4
  metrics.forEach((m, i) => {
    const x = 12 + (i * (boxW + 4))
    doc.setFillColor(...m.color)
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(m.value), x + boxW / 2, y + 10, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(m.label, x + boxW / 2, y + 17, { align: 'center' })
  })
  y += 35
  
  // Assets by Type
  if (stats?.by_type?.length > 0) {
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Assets by Type', 12, y)
    y += 5
    
    autoTable(doc, {
      startY: y,
      head: [['Asset Type', 'Count']],
      body: stats.by_type.map(t => [
        (t.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        String(t.count)
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: COLORS.light }
    })
    y = doc.lastAutoTable.finalY + 10
  }
  
  // Assets by County
  if (stats?.by_county?.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Assets by County', 12, y)
    y += 5
    
    autoTable(doc, {
      startY: y,
      head: [['County', 'Asset Count']],
      body: stats.by_county.map(c => [c.county || 'Unknown', String(c.count)]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: COLORS.light }
    })
    y = doc.lastAutoTable.finalY + 10
  }
  
  // Full Asset Inventory
  if (y > 200) { doc.addPage(); y = 20 }
  
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Complete Asset Inventory', 12, y)
  y += 5
  
  const inventoryData = assets.map(a => [
    a.name || '-',
    (a.type || '').replace(/_/g, ' '),
    a.county || '-',
    (a.status || '-').toUpperCase(),
    (a.condition || '-').toUpperCase(),
    a.serial_number || '-'
  ])
  
  autoTable(doc, {
    startY: y,
    head: [['Name', 'Type', 'County', 'Status', 'Condition', 'Serial']],
    body: inventoryData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    alternateRowStyles: { fillColor: COLORS.light },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 28 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 35 }
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        if (data.column.index === 3) {
          if (data.cell.raw === 'ACTIVE') data.cell.styles.textColor = COLORS.success
          else if (data.cell.raw === 'OFFLINE') data.cell.styles.textColor = COLORS.danger
        }
        if (data.column.index === 4) {
          if (data.cell.raw === 'CRITICAL') data.cell.styles.textColor = COLORS.danger
          else if (data.cell.raw === 'POOR') data.cell.styles.textColor = COLORS.warning
          else if (data.cell.raw === 'GOOD') data.cell.styles.textColor = COLORS.success
        }
      }
    }
  })
  
  addPageFooter(doc)
  
  const filename = `MajiSmart_Asset_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}

// ============================================
// SINGLE ASSET REPORT
// ============================================
export async function generateSingleAssetReport(assetData) {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const asset = assetData.asset || assetData
  const maintenance = assetData.maintenance || []
  const inspections = assetData.inspections || []
  
  addPageHeader(doc, 'Asset Detail Report', `${asset.name}`)
  
  let y = 50
  
  // Asset Info Card
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(12, y, pw - 24, 55, 3, 3, 'F')
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.roundedRect(12, y, pw - 24, 55, 3, 3, 'S')
  
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(asset.name, 18, y + 10)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.text)
  
  const info = [
    ['Type:', (asset.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
    ['County:', asset.county || 'N/A'],
    ['Status:', (asset.status || 'unknown').toUpperCase()],
    ['Condition:', (asset.condition || 'good').toUpperCase()],
    ['Serial:', asset.serial_number || 'N/A'],
    ['Manufacturer:', asset.manufacturer || 'N/A']
  ]
  
  let infoX = 18
  let infoY = y + 20
  info.forEach((item, i) => {
    if (i === 3) { infoX = pw / 2; infoY = y + 20 }
    doc.setFont('helvetica', 'bold')
    doc.text(item[0], infoX, infoY)
    doc.setFont('helvetica', 'normal')
    doc.text(item[1], infoX + 22, infoY)
    infoY += 7
  })
  
  y += 65
  
  // Location
  if (asset.latitude && asset.longitude) {
    doc.setFillColor(...COLORS.light)
    doc.roundedRect(12, y, pw - 24, 15, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('📍 Location:', 18, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.text)
    doc.text(`${Number(asset.latitude).toFixed(6)}, ${Number(asset.longitude).toFixed(6)}`, 45, y + 9)
    y += 22
  }
  
  // Lifecycle Info
  if (asset.installation_date || asset.age_years) {
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Lifecycle Information', 12, y)
    y += 5
    
    autoTable(doc, {
      startY: y,
      body: [
        ['Installation Date', asset.installation_date ? new Date(asset.installation_date).toLocaleDateString() : 'Not recorded'],
        ['Asset Age', asset.age_years ? `${asset.age_years} years` : 'Unknown'],
        ['Expected Lifespan', asset.expected_lifespan_years ? `${asset.expected_lifespan_years} years` : 'Not specified'],
        ['Warranty Expires', asset.warranty_expires ? new Date(asset.warranty_expires).toLocaleDateString() : 'Not specified'],
        ['Last Maintenance', asset.last_maintenance_date ? new Date(asset.last_maintenance_date).toLocaleDateString() : 'Never'],
        ['Next Maintenance', asset.next_maintenance_date ? new Date(asset.next_maintenance_date).toLocaleDateString() : 'Not scheduled'],
        ['Next Inspection', asset.next_inspection_date ? new Date(asset.next_inspection_date).toLocaleDateString() : 'Not scheduled']
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.dark }, 1: { textColor: COLORS.text } }
    })
    y = doc.lastAutoTable.finalY + 10
  }
  
  // Maintenance History
  if (y > 220) { doc.addPage(); y = 20 }
  
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Maintenance History (${maintenance.length} records)`, 12, y)
  y += 5
  
  if (maintenance.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Performed By', 'Cost (KES)', 'Description']],
      body: maintenance.map(m => [
        new Date(m.performed_at).toLocaleDateString(),
        (m.maintenance_type || '').toUpperCase(),
        m.performed_by || '-',
        m.cost_ksh ? Number(m.cost_ksh).toLocaleString() : '-',
        (m.description || '-').substring(0, 40)
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: COLORS.light },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 }, 3: { cellWidth: 25 }, 4: { cellWidth: 'auto' } }
    })
    y = doc.lastAutoTable.finalY + 10
    
    // Total cost
    const totalCost = maintenance.reduce((sum, m) => sum + (parseFloat(m.cost_ksh) || 0), 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`Total Maintenance Cost: KES ${totalCost.toLocaleString()}`, 12, y)
    y += 10
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.text)
    doc.text('No maintenance records available.', 12, y)
    y += 10
  }
  
  // Inspection History
  if (y > 220) { doc.addPage(); y = 20 }
  
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Inspection History (${inspections.length} records)`, 12, y)
  y += 5
  
  if (inspections.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Inspector', 'Rating', 'Findings']],
      body: inspections.map(i => [
        new Date(i.inspected_at).toLocaleDateString(),
        i.inspector_name || '-',
        (i.condition_rating || '-').toUpperCase(),
        (i.findings || '-').substring(0, 50)
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.purple, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: COLORS.light }
    })
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.text)
    doc.text('No inspection records available.', 12, y)
    y += 10
  }
  
  // Notes
  if (asset.notes) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', 12, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.text)
    doc.text(asset.notes, 12, y, { maxWidth: pw - 24 })
  }
  
  addPageFooter(doc)
  
  const safeName = (asset.name || 'asset').replace(/[^a-z0-9]/gi, '_').substring(0, 30)
  const filename = `MajiSmart_Asset_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}
