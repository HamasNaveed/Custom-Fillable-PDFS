import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generatePDF(formData, signatures) {
  // Load original PDF from public assets
  const response = await fetch('/template.pdf');
  const pdfBytes = await response.arrayBuffer();
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Standard fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Helper to draw text
  const drawText = (pageNumber, text, x, y, size = 9, bold = false) => {
    if (!text || pageNumber < 1 || pageNumber > pages.length) return;
    const page = pages[pageNumber - 1];
    page.drawText(String(text), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  // Helper to draw a yellow highlight indicating a choice
  const drawHighlight = (pageNumber, x, y, width, height) => {
    if (pageNumber < 1 || pageNumber > pages.length) return;
    const page = pages[pageNumber - 1];
    page.drawRectangle({
      x,
      y: y - 2, // offset baseline slightly
      width,
      height,
      color: rgb(1, 0.9, 0), // bright yellow
      opacity: 0.45,
    });
  };

  // Helper to embed and draw signature
  const drawSignature = async (pageNumber, signatureDataUrl, x, y, width = 120, height = 30) => {
    if (!signatureDataUrl || pageNumber < 1 || pageNumber > pages.length) return;
    const page = pages[pageNumber - 1];
    try {
      const imageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);
      page.drawImage(image, {
        x,
        y,
        width,
        height,
      });
    } catch (e) {
      console.error("Failed to embed signature:", e);
    }
  };

  // Helper to split a long text into multiple lines for PDF drawing
  const drawMultilineText = (pageNumber, text, x, startY, lineSpacing = 12.5, maxLines = 4, fontSize = 9) => {
    if (!text) return;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    // Estimate width limits (A4 page width is ~595pt, margins are ~56pt)
    const maxWidth = 480; 
    
    for (let word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw lines
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      drawText(pageNumber, lines[i], x, startY - (i * lineSpacing), fontSize);
    }
  };

  // ==========================================
  // PAGE 2: PERSONAL DETAILS & HEALTH/SAFETY
  // ==========================================
  
  // Personal Details
  drawText(2, formData.title, 85, 617);
  drawText(2, formData.firstName, 270, 617);
  drawText(2, formData.lastName, 430, 617);
  drawText(2, formData.dob, 125, 600);
  drawText(2, formData.gender, 340, 600);
  drawText(2, formData.contactNumber, 130, 583);
  drawText(2, formData.nationalInsurance, 410, 583);
  
  // Home Address (split into two fields if too long)
  if (formData.homeAddress && formData.homeAddress.length > 50) {
    drawText(2, formData.homeAddress.substring(0, 50), 130, 566);
    drawText(2, formData.homeAddress.substring(50), 130, 549);
  } else {
    drawText(2, formData.homeAddress, 130, 566);
  }
  drawText(2, formData.postcode, 475, 558);
  
  // Passport (highlight Selection)
  if (formData.passportType === 'British') {
    drawHighlight(2, 94, 522, 30, 10);
  } else if (formData.passportType === 'Other') {
    drawHighlight(2, 128, 522, 25, 10);
  }
  
  drawText(2, formData.passportNumber, 280, 526);
  drawText(2, formData.passportExpiry, 430, 526);
  drawText(2, formData.nationality, 110, 503);
  drawText(2, formData.countryOfIssue, 375, 503);
  
  // Right to Work (highlight Selection)
  if (formData.rightToWork === 'Yes') {
    drawHighlight(2, 205, 473, 18, 10);
  } else if (formData.rightToWork === 'No') {
    drawHighlight(2, 224, 473, 15, 10);
  }
  
  drawText(2, formData.rightToWorkRef, 375, 486);
  drawText(2, formData.rightToWorkCheckDate, 375, 469);
  
  // Emergency Contact 1
  drawText(2, formData.emergency1Title, 85, 435);
  drawText(2, formData.emergency1FirstName, 270, 435);
  drawText(2, formData.emergency1LastName, 430, 435);
  
  if (formData.emergency1Address && formData.emergency1Address.length > 50) {
    drawText(2, formData.emergency1Address.substring(0, 50), 130, 418);
    drawText(2, formData.emergency1Address.substring(50), 130, 401);
  } else {
    drawText(2, formData.emergency1Address, 130, 418);
  }
  drawText(2, formData.emergency1Postcode, 475, 410);
  drawText(2, formData.emergency1Contact, 130, 385);
  drawText(2, formData.emergency1Relationship, 350, 385);
  
  // Emergency Contact 2
  drawText(2, formData.emergency2Title, 85, 351);
  drawText(2, formData.emergency2FirstName, 270, 351);
  drawText(2, formData.emergency2LastName, 430, 351);
  
  if (formData.emergency2Address && formData.emergency2Address.length > 50) {
    drawText(2, formData.emergency2Address.substring(0, 50), 130, 334);
    drawText(2, formData.emergency2Address.substring(50), 130, 317);
  } else {
    drawText(2, formData.emergency2Address, 130, 334);
  }
  drawText(2, formData.emergency2Postcode, 475, 325);
  drawText(2, formData.emergency2Contact, 130, 300);
  drawText(2, formData.emergency2Relationship, 350, 300);
  
  // Health & Safety (highlight Selection)
  if (formData.hasHealthIssues === 'Yes') {
    drawHighlight(2, 358, 208, 18, 10); 
  } else if (formData.hasHealthIssues === 'No') {
    drawHighlight(2, 386, 208, 15, 10);
  }
  drawText(2, formData.healthIssuesSpecify, 160, 181);
  
  // Adjustments (Multiline, Y starts at 143)
  drawMultilineText(2, formData.healthAdjustments, 60, 143, 12.6, 4);

  // ==========================================
  // PAGE 3: CRIMINAL RECORD & QUALIFICATIONS
  // ==========================================
  
  // Criminal Record (highlight Selection)
  if (formData.hasCriminalConvictions === 'Yes') {
    drawHighlight(3, 230, 588, 18, 10); 
  } else if (formData.hasCriminalConvictions === 'No') {
    drawHighlight(3, 249, 588, 15, 10);
  }
  
  // Convictions Table (up to 3 rows)
  const convictions = formData.convictions || [];
  for (let i = 0; i < Math.min(convictions.length, 3); i++) {
    const rowY = 530 - (i * 15);
    drawText(3, convictions[i].offenceDates, 60, rowY);
    drawText(3, convictions[i].convictionDates, 185, rowY);
    drawText(3, convictions[i].sentences, 390, rowY);
  }

  // Qualifications Table (up to 10 rows)
  const qualifications = formData.qualifications || [];
  for (let i = 0; i < Math.min(qualifications.length, 10); i++) {
    const rowY = 375 - (i * 13.5);
    drawText(3, qualifications[i].type, 60, rowY);
    drawText(3, qualifications[i].dateObtained, 380, rowY);
    drawText(3, qualifications[i].dateExpiry, 460, rowY);
  }

  // ==========================================
  // PAGE 4: SIGNATURES & DECLARATIONS
  // ==========================================
  
  // 1. Sub-Contractor Training
  drawText(4, formData.printedName1, 214, 550);
  drawText(4, formData.dateSign1, 371, 550);
  await drawSignature(4, signatures.training, 56, 528, 120, 30);
  
  // 2. Acceptance Handbook Policies
  await drawSignature(4, signatures.handbook, 61, 380, 120, 30);
  
  // 3. Tooling Requirements
  await drawSignature(4, signatures.tooling, 63, 260, 120, 30);
  
  // 4. Contractor Declaration
  drawText(4, formData.printedName2, 214, 130);
  drawText(4, formData.dateSign2, 371, 130);
  await drawSignature(4, signatures.declaration, 56, 108, 120, 30);
  
  // Save PDF as bytes
  const pdfBytesModified = await pdfDoc.save();
  return pdfBytesModified;
}
