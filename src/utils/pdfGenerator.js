import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generatePDF(formData, signatures) {
  // Load original PDF from public assets
  const response = await fetch('/template.pdf');
  const pdfBytes = await response.arrayBuffer();
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();
  
  // Standard fonts for fallback drawing
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Helper to draw text (used as fallback for fields that aren't native inputs)
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

  // Helper to safely set interactive text field values
  const setFieldText = (fieldName, value) => {
    if (!value) return;
    try {
      const field = form.getTextField(fieldName);
      field.setText(String(value));
    } catch (e) {
      console.warn(`Could not set text field "${fieldName}":`, e.message);
    }
  };

  // Helper to safely select single-option radio fields
  const selectRadio = (groupName, value) => {
    try {
      const group = form.getRadioGroup(groupName);
      group.select(value);
    } catch (e) {
      console.warn(`Could not select radio group "${groupName}":`, e.message);
    }
  };

  // Helper to parse dates into separate Day, Month, Year digit fields
  const fillSplitDate = (dateStr, dayField, monthField, yearField) => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0].slice(-2); // e.g. "26" from "2026"
      const month = parts[1];          // e.g. "07"
      const day = parts[2];            // e.g. "01"
      setFieldText(dayField, day);
      setFieldText(monthField, month);
      setFieldText(yearField, year);
    } else {
      setFieldText(dayField, dateStr);
    }
  };

  // ==========================================
  // PAGE 2: PERSONAL DETAILS & HEALTH/SAFETY
  // ==========================================
  
  // Personal Details
  setFieldText('text_1plff', formData.title);
  setFieldText('text_2vfcv', formData.firstName);
  setFieldText('text_3bqz', formData.lastName);
  setFieldText('text_4uojm', formData.dob);
  setFieldText('text_5djai', formData.gender);
  setFieldText('text_6fyfs', formData.contactNumber);
  setFieldText('text_7amgt', formData.nationalInsurance);
  
  // Combined address and postcode in the main textarea
  const fullAddress = `${formData.homeAddress || ''} ${formData.postcode || ''}`.trim();
  setFieldText('textarea_15fdju', fullAddress);

  // Passport (single-choice radio groups)
  if (formData.passportType === 'British') {
    selectRadio('radio_group_10ypgf', 'Value_tdai');
  } else if (formData.passportType === 'Other') {
    selectRadio('radio_group_11fpoa', 'Value_mdyo');
  }

  setFieldText('text_12goot', formData.passportNumber);
  setFieldText('text_16xrdh', formData.passportExpiry);
  setFieldText('text_17dyln', formData.nationality);
  setFieldText('text_18mxrq', formData.countryOfIssue);

  // Right to work status (single-choice radio groups)
  if (formData.rightToWork === 'Yes') {
    selectRadio('radio_group_20zfac', 'Value_eqju');
  } else if (formData.rightToWork === 'No') {
    selectRadio('radio_group_21eubs', 'Value_zkfl');
  }

  setFieldText('text_19noig', formData.rightToWorkRef);
  setFieldText('text_23xknv', formData.rightToWorkCheckDate);

  // Emergency Contact 1
  setFieldText('text_24biim', formData.emergency1Title);
  setFieldText('text_25keiz', formData.emergency1FirstName);
  setFieldText('text_26yast', formData.emergency1LastName);
  setFieldText('textarea_27wng', formData.emergency1Address);
  setFieldText('text_28gbcf', formData.emergency1Postcode);
  setFieldText('text_29dsra', formData.emergency1Contact);
  setFieldText('text_30rkzt', formData.emergency1Relationship);

  // Emergency Contact 2
  setFieldText('text_31wnsq', formData.emergency2Title);
  setFieldText('text_32zuus', formData.emergency2FirstName);
  setFieldText('text_33wjnn', formData.emergency2LastName);
  setFieldText('textarea_34cdpm', formData.emergency2Address);
  setFieldText('text_35xqpd', formData.emergency2Postcode);
  setFieldText('text_36yavt', formData.emergency2Contact);
  setFieldText('text_37iqmh', formData.emergency2Relationship);

  // Health and safety selection
  if (formData.hasHealthIssues === 'Yes') {
    selectRadio('radio_group_38supt', 'Value_aefc');
    // Draw specify text at coordinates (fallback since PDF field was not auto-detected)
    drawText(2, formData.healthIssuesSpecify, 160, 181);
  } else if (formData.hasHealthIssues === 'No') {
    selectRadio('radio_group_40hfcc', 'Value_qvwi');
  }

  setFieldText('textarea_41ljjc', formData.healthAdjustments);

  // ==========================================
  // PAGE 3: CRIMINAL RECORD & QUALIFICATIONS
  // ==========================================

  // Criminal convictions choice
  if (formData.hasCriminalConvictions === 'Yes') {
    selectRadio('radio_group_42ncfu', 'Value_rsri');
  } else if (formData.hasCriminalConvictions === 'No') {
    selectRadio('radio_group_43djun', 'Value_qmpg');
  }

  // Convictions Table
  const convictions = formData.convictions || [];
  // Row 0 has native form fields
  if (convictions.length > 0) {
    setFieldText('textarea_44uvjr', convictions[0].offenceDates);
    setFieldText('text_45xtok', convictions[0].convictionDates);
    setFieldText('textarea_46xorm', convictions[0].sentences);
  }
  // Row 1 & Row 2 do not have native form fields; draw manually
  for (let i = 1; i < Math.min(convictions.length, 3); i++) {
    const rowY = 530 - (i * 15);
    drawText(3, convictions[i].offenceDates, 60, rowY);
    drawText(3, convictions[i].convictionDates, 185, rowY);
    drawText(3, convictions[i].sentences, 390, rowY);
  }

  // Qualifications Table (mapped to all 10 row fields)
  const qualFields = [
    { type: 'text_47dhqv', obtained: 'text_58zlqx', expiry: 'text_61yese' },
    { type: 'text_49ptfe', obtained: 'text_59byuv', expiry: 'text_69xhwa' },
    { type: 'text_50ucik', obtained: 'text_60huii', expiry: 'text_70uzff' },
    { type: 'text_51crhb', obtained: 'text_62hfpi', expiry: 'text_71ndqm' },
    { type: 'text_52pedw', obtained: 'text_63grsw', expiry: 'text_72dmfk' },
    { type: 'text_53bjo', obtained: 'text_64ecba', expiry: 'text_73vvyp' },
    { type: 'text_54fdzf', obtained: 'text_65dqyz', expiry: 'text_74gxyx' },
    { type: 'text_55mdiv', obtained: 'text_66vrbn', expiry: 'text_75cueg' },
    { type: 'text_56tppq', obtained: 'text_67pust', expiry: 'text_76lyfv' },
    { type: 'text_57jeig', obtained: 'text_68ljov', expiry: 'text_77dopc' }
  ];

  const qualifications = formData.qualifications || [];
  for (let i = 0; i < Math.min(qualifications.length, 10); i++) {
    setFieldText(qualFields[i].type, qualifications[i].type);
    setFieldText(qualFields[i].obtained, qualifications[i].dateObtained);
    setFieldText(qualFields[i].expiry, qualifications[i].dateExpiry);
  }

  // ==========================================
  // PAGE 4: SIGNATURES & DECLARATIONS
  // ==========================================

  // 1. Sub-Contractor Training
  setFieldText('text_79kjsd', formData.printedName1);
  fillSplitDate(formData.dateSign1, 'text_80yfik', 'text_81qrcc', 'text_82pynq');
  await drawSignature(4, signatures.training, 91, 547, 114, 23);

  // 2. Acceptance Handbook Policies
  await drawSignature(4, signatures.handbook, 102, 398, 124, 19);

  // 3. Tooling Requirements
  await drawSignature(4, signatures.tooling, 102, 279, 124, 19);

  // 4. Contractor Declaration
  setFieldText('text_86zoyh', formData.printedName2);
  fillSplitDate(formData.dateSign2, 'text_87qcjo', 'text_88spuk', 'text_89ddqf');
  await drawSignature(4, signatures.declaration, 92, 127, 107, 23);

  // Save the modified PDF containing fillable fields
  const pdfBytesModified = await pdfDoc.save();
  return pdfBytesModified;
}
