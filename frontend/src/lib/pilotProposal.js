import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// One-page county pilot proposal, generated client-side from the public
// commercial model. Every figure matches the published pricing tiers —
// nothing is invented at generation time.
export function generatePilotProposal({ contactEmail = 'info@majismart.co.ke' } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = 595
  let y = 64

  doc.setFillColor(7, 21, 47)
  doc.rect(0, 0, W, 150, 'F')
  doc.setTextColor(212, 175, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('MAJISMART OS  •  KENYA DIGITAL WATER UTILITY', 48, 52)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.text('90-Day Paid Pilot Proposal', 48, 86)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 210, 225)
  doc.text('Cut collection cost from ~35% cash to 94%+ digital. Prove −5 pts NRW in 1 DMA in 90 days, or SaaS is refunded.', 48, 110, { maxWidth: 500 })

  y = 190
  doc.setTextColor(12, 10, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Why now', 48, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  const lines = [
    '• Kenya loses ~48% non-revenue water (WASREB Impact 18) — KES 13.7B+ above the 25% benchmark.',
    '• Cash kiosk collection runs 35–40%; digitized utilities collect 94%+ via M-Pesa.',
    '• Counties are publicly benchmarked (top/bottom 10) — rankings pressure sells.',
  ]
  lines.forEach((l) => {
    doc.text(l, 48, y, { maxWidth: 500 })
    y += 16
  })

  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Pilot terms', 48, y)
  y += 8
  autoTable(doc, {
    startY: y,
    margin: { left: 48, right: 48 },
    head: [['Item', 'Detail']],
    body: [
      ['Scope', '1 DMA (up to 10 bulk zones) + billing, mobile reading, M-Pesa reconciliation, WASREB reports'],
      ['Fee', 'KES 350,000 for 90 days — credited in full against an annual plan'],
      ['Starter (post-pilot)', 'KES 45,000 / month per 5,000 connections: billing, mobile reading, M-Pesa reconciliation'],
      ['NRW Pro', 'KES 120,000–250,000 / month per DMA after pilot'],
      ['Gain-share', '15% of incremental collection above baseline for 12 months (capped)'],
      ['Success bar', '−5 pts NRW in the pilot DMA in 90 days, or SaaS refunded'],
      ['Hardware', 'KEBS-approved meters resold at cost; Dayliff/Mobi-compatible drivers included'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [7, 21, 47], textColor: [212, 175, 55] },
    styles: { fontSize: 10, cellPadding: 8 },
  })

  // eslint-disable-next-line no-underscore-dangle
  y = doc.lastAutoTable.finalY + 26
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Next step', 48, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.text(`One scoping call, one written quote, then weekly clickable demos. Contact: ${contactEmail}`, 48, y, { maxWidth: 500 })
  y += 34
  doc.setFontSize(9)
  doc.setTextColor(109, 108, 107)
  doc.text(`Generated ${new Date().toLocaleDateString('en-KE')} · Figures follow published MajiSmart tiers · MajiSmart Kenya`, 48, y)

  doc.save('MajiSmart-90-day-pilot-proposal.pdf')
  return true
}
