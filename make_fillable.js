import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function main() {
  console.log("Loading original template.pdf...");
  const pdfBytes = fs.readFileSync('public/template.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  // Helper to add a text field
  const addTextField = (pageIndex, name, x, y, width, height, multiline = false) => {
    const page = pages[pageIndex - 1];
    const field = form.createTextField(name);
    field.addToPage(page, { 
      x, 
      y: y - 2, // adjust slightly to align with the visual text line
      width, 
      height,
    });
    if (multiline) {
      field.enableMultiline();
    }
    field.setFontSize(9);
    console.log(`Added text field: "${name}" on page ${pageIndex}`);
    return field;
  };

  // Helper to add a checkbox / option highlight (we can use checkboxes!)
  const addCheckboxField = (pageIndex, name, x, y, width, height) => {
    const page = pages[pageIndex - 1];
    const checkbox = form.createCheckBox(name);
    checkbox.addToPage(page, { x, y: y - 2, width, height });
    console.log(`Added checkbox: "${name}" on page ${pageIndex}`);
    return checkbox;
  };

  // ==========================================
  // PAGE 2
  // ==========================================
  addTextField(2, 'title', 85, 617, 50, 13);
  addTextField(2, 'firstName', 270, 617, 150, 13);
  addTextField(2, 'lastName', 430, 617, 120, 13);
  addTextField(2, 'dob', 125, 600, 100, 13);
  addTextField(2, 'gender', 340, 600, 70, 13);
  addTextField(2, 'contactNumber', 130, 583, 150, 13);
  addTextField(2, 'nationalInsurance', 410, 583, 130, 13);
  
  // Home Address
  addTextField(2, 'homeAddress', 130, 566, 320, 13);
  addTextField(2, 'postcode', 475, 558, 70, 13);
  
  // Passport (Checkboxes)
  addCheckboxField(2, 'passportBritish', 94, 522, 12, 10);
  addCheckboxField(2, 'passportOther', 128, 522, 12, 10);
  
  addTextField(2, 'passportNumber', 280, 526, 130, 13);
  addTextField(2, 'passportExpiry', 430, 526, 115, 13);
  addTextField(2, 'nationality', 110, 503, 200, 13);
  addTextField(2, 'countryOfIssue', 375, 503, 170, 13);
  
  // Right to Work (Checkboxes)
  addCheckboxField(2, 'rtwYes', 205, 473, 12, 10);
  addCheckboxField(2, 'rtwNo', 224, 473, 12, 10);
  
  addTextField(2, 'rightToWorkRef', 375, 486, 170, 13);
  addTextField(2, 'rightToWorkCheckDate', 375, 469, 170, 13);
  
  // Emergency Contact 1
  addTextField(2, 'emergency1Title', 85, 435, 50, 13);
  addTextField(2, 'emergency1FirstName', 270, 435, 150, 13);
  addTextField(2, 'emergency1LastName', 430, 435, 120, 13);
  addTextField(2, 'emergency1Address', 130, 418, 320, 13);
  addTextField(2, 'emergency1Postcode', 475, 410, 70, 13);
  addTextField(2, 'emergency1Contact', 130, 385, 200, 13);
  addTextField(2, 'emergency1Relationship', 350, 385, 190, 13);
  
  // Emergency Contact 2
  addTextField(2, 'emergency2Title', 85, 351, 50, 13);
  addTextField(2, 'emergency2FirstName', 270, 351, 150, 13);
  addTextField(2, 'emergency2LastName', 430, 351, 120, 13);
  addTextField(2, 'emergency2Address', 130, 334, 320, 13);
  addTextField(2, 'emergency2Postcode', 475, 325, 70, 13);
  addTextField(2, 'emergency2Contact', 130, 300, 200, 13);
  addTextField(2, 'emergency2Relationship', 350, 300, 190, 13);
  
  // Health
  addCheckboxField(2, 'healthIssuesYes', 376, 208, 12, 10);
  addCheckboxField(2, 'healthIssuesNo', 398, 208, 12, 10);
  addTextField(2, 'healthIssuesSpecify', 160, 181, 380, 13);
  addTextField(2, 'healthAdjustments', 60, 110, 480, 40, true);

  // ==========================================
  // PAGE 3
  // ==========================================
  // Criminal Record Checkboxes
  addCheckboxField(3, 'criminalConvictionsYes', 230, 588, 12, 10);
  addCheckboxField(3, 'criminalConvictionsNo', 249, 588, 12, 10);
  
  // Convictions Table (3 rows)
  for (let i = 0; i < 3; i++) {
    const rowY = 530 - (i * 15);
    addTextField(3, `offenceDates_${i}`, 60, rowY, 120, 12);
    addTextField(3, `convictionDates_${i}`, 185, rowY, 200, 12);
    addTextField(3, `sentences_${i}`, 390, rowY, 150, 12);
  }

  // Qualifications Table (10 rows)
  for (let i = 0; i < 10; i++) {
    const rowY = 375 - (i * 13.5);
    addTextField(3, `qualType_${i}`, 60, rowY, 310, 11);
    addTextField(3, `qualDateObtained_${i}`, 380, rowY, 70, 11);
    addTextField(3, `qualDateExpiry_${i}`, 460, rowY, 80, 11);
  }

  // ==========================================
  // PAGE 4
  // ==========================================
  addTextField(4, 'printedName1', 214, 550, 150, 13);
  addTextField(4, 'dateSign1', 371, 550, 100, 13);
  
  // We can add simple text fields to represent signatures as placeholder text fields
  // (so the browser/code can draw on them, or the user can type in them)
  addTextField(4, 'signatureTraining', 56, 528, 120, 20);
  addTextField(4, 'signatureHandbook', 61, 380, 120, 20);
  addTextField(4, 'signatureTooling', 63, 260, 120, 20);
  
  addTextField(4, 'printedName2', 214, 130, 150, 13);
  addTextField(4, 'dateSign2', 371, 130, 100, 13);
  addTextField(4, 'signatureDeclaration', 56, 108, 120, 20);

  // Save the fillable PDF document
  console.log("Saving modified fillable PDF...");
  const pdfBytesModified = await pdfDoc.save();
  fs.writeFileSync('public/template_fillable.pdf', pdfBytesModified);
  console.log("Success! File saved at public/template_fillable.pdf");
}

main().catch(console.error);
