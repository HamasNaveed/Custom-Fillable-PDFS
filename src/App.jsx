import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { 
  User, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  Award, 
  PenTool, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  CheckCircle,
  Plus, 
  Trash2, 
  AlertTriangle,
  HeartPulse,
  Stamp,
  FileCheck,
  Building,
  Info
} from 'lucide-react';
import { generatePDF } from './utils/pdfGenerator';

const STEPS = [
  { id: 1, name: 'Introduction', icon: Info },
  { id: 2, name: 'Personal Details', icon: User },
  { id: 3, name: 'Passport & RTW', icon: Stamp },
  { id: 4, name: 'Emergency Contacts', icon: Phone },
  { id: 5, name: 'Health & Criminal Check', icon: HeartPulse },
  { id: 6, name: 'Qualifications', icon: Award },
  { id: 7, name: 'Signatures & Submit', icon: PenTool }
];

export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Form Data State
  const [formData, setFormData] = useState({
    // Personal Details
    title: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    contactNumber: '',
    nationalInsurance: '',
    homeAddress: '',
    postcode: '',

    // Passport / Right to work
    passportType: '', // 'British' or 'Other'
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
    countryOfIssue: '',
    rightToWork: '', // 'Yes' or 'No'
    rightToWorkRef: '',
    rightToWorkCheckDate: '',

    // Emergency Contact 1
    emergency1Title: '',
    emergency1FirstName: '',
    emergency1LastName: '',
    emergency1Address: '',
    emergency1Postcode: '',
    emergency1Contact: '',
    emergency1Relationship: '',

    // Emergency Contact 2
    emergency2Title: '',
    emergency2FirstName: '',
    emergency2LastName: '',
    emergency2Address: '',
    emergency2Postcode: '',
    emergency2Contact: '',
    emergency2Relationship: '',

    // Health
    hasHealthIssues: '', // 'Yes' or 'No'
    healthIssuesSpecify: '',
    healthAdjustments: '',

    // Criminal convictions
    hasCriminalConvictions: '', // 'Yes' or 'No'
    convictions: [
      { offenceDates: '', convictionDates: '', sentences: '' }
    ],

    // Qualifications
    qualifications: [
      { type: '', dateObtained: '', dateExpiry: '' }
    ],

    // Page 4 Print names and dates
    printedName1: '',
    dateSign1: new Date().toISOString().split('T')[0],
    printedName2: '',
    dateSign2: new Date().toISOString().split('T')[0]
  });

  // Signatures State
  const [signatures, setSignatures] = useState({
    training: null,
    handbook: null,
    tooling: null,
    declaration: null
  });

  // Signature pad references
  const sigPadTraining = useRef(null);
  const sigPadHandbook = useRef(null);
  const sigPadTooling = useRef(null);
  const sigPadDeclaration = useRef(null);

  // Single signature apply option
  const [applySignatureToAll, setApplySignatureToAll] = useState(false);

  // Introduction Read Checkbox State
  const [hasReadIntro, setHasReadIntro] = useState(false);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-sync names across the form sections
      if (name === 'firstName' || name === 'lastName') {
        const fullName = `${updated.firstName} ${updated.lastName}`.trim();
        updated.printedName1 = fullName;
        updated.printedName2 = fullName;
      }
      return updated;
    });
  };

  // Qualifications Add/Remove
  const addQualificationRow = () => {
    if (formData.qualifications.length >= 10) return;
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { type: '', dateObtained: '', dateExpiry: '' }]
    }));
  };

  const removeQualificationRow = (index) => {
    setFormData((prev) => {
      const newQualifications = [...prev.qualifications];
      newQualifications.splice(index, 1);
      return { ...prev, qualifications: newQualifications.length ? newQualifications : [{ type: '', dateObtained: '', dateExpiry: '' }] };
    });
  };

  const handleQualificationChange = (index, field, value) => {
    setFormData((prev) => {
      const newQuals = [...prev.qualifications];
      newQuals[index][field] = value;
      return { ...prev, qualifications: newQuals };
    });
  };

  // Convictions Add/Remove
  const addConvictionRow = () => {
    if (formData.convictions.length >= 3) return;
    setFormData((prev) => ({
      ...prev,
      convictions: [...prev.convictions, { offenceDates: '', convictionDates: '', sentences: '' }]
    }));
  };

  const removeConvictionRow = (index) => {
    setFormData((prev) => {
      const newConvictions = [...prev.convictions];
      newConvictions.splice(index, 1);
      return { ...prev, convictions: newConvictions.length ? newConvictions : [{ offenceDates: '', convictionDates: '', sentences: '' }] };
    });
  };

  const handleConvictionChange = (index, field, value) => {
    setFormData((prev) => {
      const newConvictions = [...prev.convictions];
      newConvictions[index][field] = value;
      return { ...prev, convictions: newConvictions };
    });
  };

  // Signature pad save/clear handlers
  const handleSignatureEnd = (padName, sigRef) => {
    if (sigRef.current) {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setSignatures((prev) => {
        const next = { ...prev, [padName]: dataUrl };
        // If "Apply to all" is enabled, synchronize all signature spots
        if (applySignatureToAll) {
          next.training = dataUrl;
          next.handbook = dataUrl;
          next.tooling = dataUrl;
          next.declaration = dataUrl;
        }
        return next;
      });
    }
  };

  const handleClearSignature = (padName, sigRef) => {
    if (sigRef.current) {
      sigRef.current.clear();
      setSignatures((prev) => {
        const next = { ...prev, [padName]: null };
        if (applySignatureToAll) {
          next.training = null;
          next.handbook = null;
          next.tooling = null;
          next.declaration = null;
        }
        return next;
      });
    }
  };

  // Handle checking the single signature checkbox
  const handleApplySignatureToggle = (e) => {
    const checked = e.target.checked;
    setApplySignatureToAll(checked);
    
    // If turning on and we have any signature, sync it to all
    if (checked) {
      const sourceSig = signatures.declaration || signatures.training || signatures.handbook || signatures.tooling;
      if (sourceSig) {
        setSignatures({
          training: sourceSig,
          handbook: sourceSig,
          tooling: sourceSig,
          declaration: sourceSig
        });
      }
    }
  };

  // Next / Back Navigation
  const handleNext = () => {
    if (activeStep === 1 && !hasReadIntro) {
      alert('Please check the box confirming you have read the Introduction and Policy before moving forward.');
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Form Submission and PDF Generation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: make sure declaration and names are signed/filled
    if (!signatures.training || !signatures.handbook || !signatures.tooling || !signatures.declaration) {
      alert('Please complete all 4 signature fields on the final step.');
      return;
    }

    setLoading(true);
    try {
      const pdfBytes = await generatePDF(formData, signatures);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setSuccess(true);
      
      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `MJM_Registration_${formData.firstName}_${formData.lastName}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSuccess(false);
    setPdfBlobUrl(null);
    setActiveStep(1);
    setHasReadIntro(false);
    setSignatures({
      training: null,
      handbook: null,
      tooling: null,
      declaration: null
    });
    setFormData((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      dob: '',
      contactNumber: '',
      nationalInsurance: '',
      homeAddress: '',
      postcode: '',
      qualifications: [{ type: '', dateObtained: '', dateExpiry: '' }],
      convictions: [{ offenceDates: '', convictionDates: '', sentences: '' }]
    }));
  };

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Generating Pixel-Perfect Signed PDF...</p>
        </div>
      )}

      <header className="header">
        <h1>MJM Industrial Ltd</h1>
        <p>Sub-Contractor Registration Portal</p>
      </header>

      {/* Steps Indicator */}
      <div className="step-indicator">
        <div 
          className="step-progress-bar" 
          style={{ width: `${((activeStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;
          return (
            <div 
              key={step.id} 
              className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => {
                if (success) return;
                if (step.id > 1 && !hasReadIntro) {
                  alert('Please check the box confirming you have read the Introduction and Policy before moving forward.');
                  return;
                }
                setActiveStep(step.id);
              }}
            >
              <div className="step-circle">
                {isCompleted ? <FileCheck size={18} /> : <Icon size={18} />}
              </div>
              <span className="step-label">{step.name}</span>
            </div>
          );
        })}
      </div>

      <div className="glass-card">
        {success ? (
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle size={40} />
            </div>
            <h3>Registration Complete!</h3>
            <p>
              Your Contractor Registration Form has been successfully generated and compiled with all coordinates and signatures.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href={pdfBlobUrl} download={`MJM_Registration_${formData.firstName}_${formData.lastName}.pdf`} className="btn btn-primary">
                <Download size={18} /> Download PDF Again
              </a>
              <button onClick={handleReset} className="btn btn-secondary">
                Register Another Contractor
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* STEP 1: WELCOME & INTRODUCTION TEXTS */}
            {activeStep === 1 && (
              <div className="pdf-info-container">
                <h3 className="form-section-title"><Building size={20} /> Introduction to MJM Industrial Ltd</h3>
                
                <div className="pdf-intro-section">
                  <p className="pdf-text-p">
                    <strong>MJM Industrial Ltd</strong> was started in April 2000, we provide tailored mechanical, electrical and civil engineering solutions with the professional expertise, customer service and support you need 24 hours a day 7 days a week. MJM hold an Airside Operator License, with a large team of trained Airside passed personnel with a fleet of vehicles working 5 minutes from Heathrow Terminal 5.
                  </p>
                  
                  <p className="pdf-text-p">
                    MJM Industrial is a well-established business with a reputation for the delivery of reliable and flexible services that are underpinned by first-class customer support.
                  </p>
                  
                  <p className="pdf-text-p" style={{ fontWeight: '500', marginBottom: '0.75rem' }}>
                    We operate from five divisions, offering from one to a total engineering package:
                  </p>
                  
                  <div className="division-grid">
                    <div className="division-badge-card">
                      <h4>PRO Division</h4>
                      <p>Engineering component sales, repair and overhaul to industry.</p>
                    </div>
                    <div className="division-badge-card">
                      <h4>CES Division</h4>
                      <p>Outsourced maintenance services, contract engineering.</p>
                    </div>
                    <div className="division-badge-card">
                      <h4>ELE Division</h4>
                      <p>Electrical projects and installation.</p>
                    </div>
                    <div className="division-badge-card">
                      <h4>FAB Division</h4>
                      <p>Fabrication and machining workshop.</p>
                    </div>
                    <div className="division-badge-card">
                      <h4>RMP Division</h4>
                      <p>Refurbishment and maintenance projects.</p>
                    </div>
                  </div>

                  <p className="pdf-text-p">
                    MJM Industrial operates in a range of industries including: Food and drink manufacture and process, Airport, Breweries, Construction, Quarry, Property maintenance, Film and Leisure, and PR, Marketing and Exhibitions.
                  </p>
                  
                  <p className="pdf-text-p">
                    <strong>Our Vision:</strong> To become the No.1 service provider of choice to tier 1 customers at Heathrow, aligning our products and services with Heathrow’s vision to give passengers the best airport service in the world.
                  </p>
                </div>

                <div className="policy-block">
                  <h4>Equal Opportunities Policy</h4>
                  <p>
                    MJM Industrial is a company that takes its commitment to equal opportunities very seriously. They believe that everyone deserves to be treated fairly and with respect, regardless of their gender, sexual orientation, gender identity, marital status, age, disability, race, religion, or any other characteristic.
                  </p>
                  <p style={{ marginTop: '0.75rem' }}>
                    To ensure that this policy is upheld, they will regularly review all aspects of their recruitment process to prevent any form of discrimination. Additionally, they expect all their staff to follow this policy and treat every applicant equally. They will not discriminate when deciding which sub-contractor worker to submit for a vacancy or assignment, or in any terms of employment or engagement for temporary workers. They will evaluate each contractor based on their merits, qualifications, and ability to perform the duties required for the job, and nothing else. Overall, MJM Industrial is committed to creating an inclusive and welcoming environment where everyone has an equal chance to succeed.
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.75rem', border: '1px dashed rgba(99, 102, 241, 0.25)' }}>
                  <input 
                    type="checkbox" 
                    id="readIntro" 
                    checked={hasReadIntro} 
                    onChange={(e) => setHasReadIntro(e.target.checked)} 
                    style={{ width: '1.3rem', height: '1.3rem', accentColor: 'var(--primary)', cursor: 'pointer' }} 
                  />
                  <label htmlFor="readIntro" style={{ color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                    I have read and agree to the MJM Introduction, Vision, and Equal Opportunities Policy.
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL DETAILS */}
            {activeStep === 2 && (
              <div>
                <h3 className="form-section-title"><User size={20} /> Personal Details</h3>
                <div className="form-grid">
                  <div className="form-group col-2">
                    <label>Title <span className="required">*</span></label>
                    <select name="title" value={formData.title} onChange={handleInputChange} required>
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div className="form-group col-5">
                    <label>First Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="firstName" 
                      placeholder="e.g. John" 
                      value={formData.firstName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-5">
                    <label>Last Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder="e.g. Doe" 
                      value={formData.lastName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Date of Birth <span className="required">*</span></label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formData.dob} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Gender <span className="required">*</span></label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group col-4">
                    <label>Contact Number <span className="required">*</span></label>
                    <input 
                      type="tel" 
                      name="contactNumber" 
                      placeholder="e.g. 07123456789" 
                      value={formData.contactNumber} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-12">
                    <label>National Insurance Number <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="nationalInsurance" 
                      placeholder="e.g. QQ 12 34 56 A" 
                      value={formData.nationalInsurance} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-8">
                    <label>Home Address <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="homeAddress" 
                      placeholder="Street, City, County" 
                      value={formData.homeAddress} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Postcode <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="postcode" 
                      placeholder="e.g. SW1A 1AA" 
                      value={formData.postcode} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PASSPORT & RIGHT TO WORK */}
            {activeStep === 3 && (
              <div>
                <h3 className="form-section-title"><Stamp size={20} /> Passport & Right To Work Check</h3>
                
                <div className="policy-block" style={{ borderLeftColor: 'var(--secondary)', background: 'rgba(6, 182, 212, 0.03)', marginTop: '0', marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: '0.85rem' }}>
                    <strong>Passport Policy:</strong> If not a British Passport holder – Please circle. Do you have the Right to work in the UK: Yes/No. Ensure all details match your official documents.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-group col-6">
                    <label>Passport Type <span className="required">*</span></label>
                    <div className="radio-group">
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="passportType" 
                          value="British" 
                          checked={formData.passportType === 'British'}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="radio-content">British Passport</span>
                      </label>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="passportType" 
                          value="Other" 
                          checked={formData.passportType === 'Other'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-content">Other Passport</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group col-6">
                    <label>Passport Number <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="passportNumber" 
                      placeholder="Enter Passport Number" 
                      value={formData.passportNumber} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Date of Expiry <span className="required">*</span></label>
                    <input 
                      type="date" 
                      name="passportExpiry" 
                      value={formData.passportExpiry} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Nationality <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="nationality" 
                      placeholder="e.g. British" 
                      value={formData.nationality} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Country of Issue <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="countryOfIssue" 
                      placeholder="e.g. United Kingdom" 
                      value={formData.countryOfIssue} 
                      onChange={handleInputChange} 
                      required
                    />
                  </div>

                  <div className="form-group col-12" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                    <label>Do you have the Right to Work in the UK? <span className="required">*</span></label>
                    <div className="radio-group" style={{ maxWidth: '300px', marginBottom: '1rem' }}>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="rightToWork" 
                          value="Yes" 
                          checked={formData.rightToWork === 'Yes'}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="radio-content">Yes</span>
                      </label>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="rightToWork" 
                          value="No" 
                          checked={formData.rightToWork === 'No'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-content">No</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group col-6">
                    <label>Share Code / Reference Number</label>
                    <input 
                      type="text" 
                      name="rightToWorkRef" 
                      placeholder="e.g. 9-digit Share Code" 
                      value={formData.rightToWorkRef} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Date of Right to Work Check</label>
                    <input 
                      type="date" 
                      name="rightToWorkCheckDate" 
                      value={formData.rightToWorkCheckDate} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: EMERGENCY CONTACTS */}
            {activeStep === 4 && (
              <div>
                {/* Emergency Contact 1 */}
                <h3 className="form-section-title"><Phone size={20} /> Emergency Contact 1</h3>
                <div className="form-grid" style={{ marginBottom: '2.5rem' }}>
                  <div className="form-group col-2">
                    <label>Title <span className="required">*</span></label>
                    <select name="emergency1Title" value={formData.emergency1Title} onChange={handleInputChange} required>
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  <div className="form-group col-5">
                    <label>First Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency1FirstName" 
                      placeholder="First Name" 
                      value={formData.emergency1FirstName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-5">
                    <label>Last Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency1LastName" 
                      placeholder="Last Name" 
                      value={formData.emergency1LastName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-8">
                    <label>Home Address <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency1Address" 
                      placeholder="Address Line" 
                      value={formData.emergency1Address} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Postcode <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency1Postcode" 
                      placeholder="Postcode" 
                      value={formData.emergency1Postcode} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Contact Number <span className="required">*</span></label>
                    <input 
                      type="tel" 
                      name="emergency1Contact" 
                      placeholder="e.g. 07123456789" 
                      value={formData.emergency1Contact} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-6">
                    <label>Relationship <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency1Relationship" 
                      placeholder="e.g. Spouse, Parent, Friend" 
                      value={formData.emergency1Relationship} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>

                {/* Emergency Contact 2 */}
                <h3 className="form-section-title"><Phone size={20} /> Emergency Contact 2</h3>
                <div className="form-grid">
                  <div className="form-group col-2">
                    <label>Title <span className="required">*</span></label>
                    <select name="emergency2Title" value={formData.emergency2Title} onChange={handleInputChange} required>
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  <div className="form-group col-5">
                    <label>First Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency2FirstName" 
                      placeholder="First Name" 
                      value={formData.emergency2FirstName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-5">
                    <label>Last Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency2LastName" 
                      placeholder="Last Name" 
                      value={formData.emergency2LastName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-8">
                    <label>Home Address <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency2Address" 
                      placeholder="Address Line" 
                      value={formData.emergency2Address} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Postcode <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency2Postcode" 
                      placeholder="Postcode" 
                      value={formData.emergency2Postcode} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Contact Number <span className="required">*</span></label>
                    <input 
                      type="tel" 
                      name="emergency2Contact" 
                      placeholder="e.g. 07123456789" 
                      value={formData.emergency2Contact} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group col-6">
                    <label>Relationship <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="emergency2Relationship" 
                      placeholder="e.g. Spouse, Parent, Friend" 
                      value={formData.emergency2Relationship} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: HEALTH & CRIMINAL CHECKS */}
            {activeStep === 5 && (
              <div>
                <h3 className="form-section-title"><HeartPulse size={20} /> Health and Safety</h3>
                
                <p className="pdf-text-p" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <strong>Health and disability:</strong> These questions are asked in order to find out your needs in terms of access to our services and to find out your needs in order for MJM Industrial to place you in the correct role.
                </p>

                <div className="form-grid" style={{ marginBottom: '2.5rem' }}>
                  <div className="form-group col-12">
                    <label style={{ fontSize: '0.95rem' }}>
                      Do you have any health issues or disabilities which could affect the project you work on? Yes / No (circle) <span className="required">*</span>
                    </label>
                    <div className="radio-group" style={{ maxWidth: '300px', marginTop: '0.5rem' }}>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="hasHealthIssues" 
                          value="Yes" 
                          checked={formData.hasHealthIssues === 'Yes'}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="radio-content">Yes</span>
                      </label>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="hasHealthIssues" 
                          value="No" 
                          checked={formData.hasHealthIssues === 'No'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-content">No</span>
                      </label>
                    </div>
                  </div>

                  {formData.hasHealthIssues === 'Yes' && (
                    <div className="form-group col-12">
                      <label>If yes, please specify <span className="required">*</span></label>
                      <input 
                        type="text" 
                        name="healthIssuesSpecify" 
                        placeholder="Provide details..." 
                        value={formData.healthIssuesSpecify} 
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group col-12">
                    <label>If you have a disability, what are your needs in terms of reasonable adjustment to enable you to perform the project?</label>
                    <textarea 
                      name="healthAdjustments" 
                      placeholder="Describe any adjustments needed..." 
                      value={formData.healthAdjustments} 
                      onChange={handleInputChange}
                      maxLength={400}
                    />
                  </div>
                </div>

                <h3 className="form-section-title"><ShieldAlert size={20} /> Criminal Record Check</h3>
                
                <div className="policy-block" style={{ borderLeftColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.03)', marginTop: '0', marginBottom: '1.5rem', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    We are asking you to complete this section in relation to job roles which are not exempt from the Rehabilitation of Offenders Act 1974. For this reason, you are only required to disclose information about unspent convictions. You are not required to disclose spent convictions on this form.
                  </p>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.55', marginTop: '0.5rem' }}>
                    Additionally, you are not required to declare any information about ‘protected’ offenses – (offenses to which the filtering rules apply). If you are unsure as to whether a conviction is unspent/spent or protected(filtered) please see the additional guidance at <a href="https://www.gov.uk/exoffenders-and-employment" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>https://www.gov.uk/exoffenders-and-employment</a> , or you can contact organisations such as NACRO or Unlock for further information.
                  </p>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.55', marginTop: '0.5rem' }}>
                    If you wish to be put forward for/if any role is identified which may be suitable for you but which is exempt from the Rehabilitation of Offenders Act 1974, meaning that you are required to disclose spent convictions, we will ask you to complete an additional criminal disclosure form. You are not required to complete that additional form if you do not wish to be put forward for that type of work.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-group col-12">
                    <label style={{ fontSize: '0.95rem' }}>
                      Do you have any unspent criminal convictions? Yes/No (Please circle) <span className="required">*</span>
                    </label>
                    <div className="radio-group" style={{ maxWidth: '300px', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="hasCriminalConvictions" 
                          value="Yes" 
                          checked={formData.hasCriminalConvictions === 'Yes'}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="radio-content">Yes</span>
                      </label>
                      <label className="radio-card">
                        <input 
                          type="radio" 
                          name="hasCriminalConvictions" 
                          value="No" 
                          checked={formData.hasCriminalConvictions === 'No'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-content">No</span>
                      </label>
                    </div>
                  </div>

                  {formData.hasCriminalConvictions === 'Yes' && (
                    <div className="form-group col-12">
                      <label style={{ marginBottom: '0.5rem' }}>Provide details of unspent convictions (Up to 3): (You are not required to provide any information about protected [filtered] offenses)</label>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Offence Dates</th>
                              <th>Dates of Conviction/Caution</th>
                              <th>Offense Types and Sentences</th>
                              <th style={{ width: '50px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.convictions.map((row, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input 
                                    type="text" 
                                    className="table-row-input" 
                                    placeholder="e.g. Feb 2020" 
                                    value={row.offenceDates} 
                                    onChange={(e) => handleConvictionChange(idx, 'offenceDates', e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="table-row-input" 
                                    placeholder="e.g. May 2020" 
                                    value={row.convictionDates} 
                                    onChange={(e) => handleConvictionChange(idx, 'convictionDates', e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="table-row-input" 
                                    placeholder="e.g. Speeding, £100 fine" 
                                    value={row.sentences} 
                                    onChange={(e) => handleConvictionChange(idx, 'sentences', e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <button 
                                    type="button" 
                                    onClick={() => removeConvictionRow(idx)}
                                    className="btn btn-danger-outline"
                                    style={{ padding: '0.35rem' }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {formData.convictions.length < 3 && (
                        <button type="button" onClick={addConvictionRow} className="add-row-btn">
                          <Plus size={16} /> Add Conviction Row
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="footnote-block col-12">
                    <strong>(NB:</strong> Certain types of employment and professions are exempt from the Rehabilitation of Offenders Act 1974 and in those cases particularly where the employment is sought in relation to positions involving working with children or vulnerable adults, details of all criminal convictions must be given. The information given will be treated in the strictest of confidence and only considered where, in the reasonable opinion of MJM Industrial if the offence is relevant to the post to which you are applying. Failure to declare a conviction may require us to exclude you from our register or terminate an assignment if the offence is not declared but later comes to light).
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: QUALIFICATIONS */}
            {activeStep === 6 && (
              <div>
                <h3 className="form-section-title"><Award size={20} /> Qualifications</h3>
                
                <p className="pdf-text-p" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <strong>Qualifications:</strong> Insert details of any relevant Professional qualifications you hold. (Qualification Type e.g., ESR; CSCS; ASD, etc.)
                </p>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Qualification Type (ESR; CSCS; ASD, etc)</th>
                        <th>Date Obtained</th>
                        <th>Date of Expiry</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.qualifications.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <input 
                              type="text" 
                              className="table-row-input" 
                              placeholder="e.g. CSCS Gold Card" 
                              value={row.type} 
                              onChange={(e) => handleQualificationChange(idx, 'type', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-row-input" 
                              placeholder="e.g. 15/02/2022" 
                              value={row.dateObtained} 
                              onChange={(e) => handleQualificationChange(idx, 'dateObtained', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-row-input" 
                              placeholder="e.g. 15/02/2027" 
                              value={row.dateExpiry} 
                              onChange={(e) => handleQualificationChange(idx, 'dateExpiry', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <button 
                              type="button" 
                              onClick={() => removeQualificationRow(idx)}
                              className="btn btn-danger-outline"
                              style={{ padding: '0.35rem' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.qualifications.length < 10 && (
                  <button type="button" onClick={addQualificationRow} className="add-row-btn">
                    <Plus size={16} /> Add Qualification Row
                  </button>
                )}
              </div>
            )}

            {/* STEP 7: AGREEMENTS & SIGNATURES */}
            {activeStep === 7 && (
              <div>
                <h3 className="form-section-title"><PenTool size={20} /> Policies Acceptance & Contractor Sign-Off</h3>

                {/* Policies Checkboxes */}
                <div style={{ marginBottom: '2.5rem' }}>
                  
                  {/* 1. Subcontractor training acceptance */}
                  <div className="policy-card">
                    <h4>1. Sub-Contractor Training</h4>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      Should you require any training whilst contracting for MJM Industrial all training costs will be borne by you the contractor. If you leave or choose to end your contract with MJM Industrial Limited at any time, for any reason, including dismissal, the training costs will need to be repaid by you the contractor.
                    </p>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      MJM Industrial are willing to assist with training costs by making the initial payment upfront. However, you the subcontractor will need to repay MJM Industrial in full in one of the following ways:
                    </p>
                    <ul className="list-styled" style={{ marginBottom: '0.75rem' }}>
                      <li>Upfront payment from the contractor at the start of the contract OR</li>
                      <li>100% payment in full/ week 1-4 or 1st month of working OR</li>
                      <li>12.5% per week or 50% per month up to 2 months</li>
                    </ul>
                    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      In the event of failure to pay, I agree that MJM Industrial Limited has the right as an express term of my Sub Contract Terms to deduct any outstanding amount due under this agreement from my final invoice amount or any other payments due to me on the termination of my contract in accordance with the legislation currently in force.
                    </p>
                    <p style={{ fontWeight: '600', color: 'white', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      I hereby confirm that I accept the above information.
                    </p>

                    <div className="form-grid" style={{ marginBottom: '0' }}>
                      <div className="form-group col-6">
                        <label>Printed Name <span className="required">*</span></label>
                        <input 
                          type="text" 
                          name="printedName1" 
                          value={formData.printedName1} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group col-6">
                        <label>Date <span className="required">*</span></label>
                        <input 
                          type="date" 
                          name="dateSign1" 
                          value={formData.dateSign1} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Handbook Policies acceptance */}
                  <div className="policy-card">
                    <h4>2. Acceptance Handbook Policies Risk Assessment and Manuals</h4>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                      I confirm that I have read and understood the Handbook, Policies and Risk Assessments provided. I fully accept and agree to comply with the rules and conditions outlined in these documents and acknowledge that adherence to them forms an integral part of my contract. Furthermore, I recognise my obligation to stay up to date with any updates or changes that may be made to these documents and will make every effort to remain informed of their contents. I am committed to upholding the high standards of excellence expected of me as a member of the MJM Industrial Limited team.
                    </p>
                  </div>

                  {/* 3. Tooling Requirements acceptance */}
                  <div className="policy-card">
                    <h4>3. Tooling Requirements</h4>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                      As a skilled tradesperson contracted by MJM Industrial, I acknowledge and accept my responsibility to provide and maintain all tooling relevant to the project and my area of expertise. This includes, but is not limited to, hand and power tools, measuring equipment, and any other specialized tools required for the job. I understand that failure to provide and maintain these tools to the appropriate standard could result in delays or other issues that could impact project timelines and budgets. Furthermore, I commit to promptly informing MJM Industrial of any requirements for additional specialist tooling that may be needed throughout the project, ensuring that I have the necessary resources to complete my work to the highest possible standard.
                    </p>
                  </div>

                  {/* 4. Contractor Declaration */}
                  <div className="policy-card">
                    <h4>4. Contractor Declaration</h4>
                    <h5 style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '0.25rem', fontFamily: 'Outfit' }}>Data Protection Statement</h5>
                    <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      MJM Industrial must process personal data (including sensitive personal data) in doing so, we act as a data controller. Therefore, we have asked for your personal data on this form. When we process your personal data, we must do so in accordance with data protection laws. Those laws require us to give you a Privacy Statement to explain how we manage your personal data. Please see the Privacy Statement which we will give to you separately.
                    </p>
                    <p style={{ fontWeight: '600', color: 'white', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      I hereby confirm that the information given is true and correct.
                    </p>

                    <div className="form-grid" style={{ marginBottom: '0' }}>
                      <div className="form-group col-6">
                        <label>Printed Name <span className="required">*</span></label>
                        <input 
                          type="text" 
                          name="printedName2" 
                          value={formData.printedName2} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group col-6">
                        <label>Date <span className="required">*</span></label>
                        <input 
                          type="date" 
                          name="dateSign2" 
                          value={formData.dateSign2} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature pads section */}
                <h3 className="form-section-title" style={{ marginTop: '2rem' }}><FileText size={20} /> Signatures</h3>
                
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1rem 1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <input 
                    type="checkbox" 
                    id="applyToAll" 
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    checked={applySignatureToAll}
                    onChange={handleApplySignatureToggle}
                  />
                  <label htmlFor="applyToAll" style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}>
                    ✍️ Apply a single signature to all 4 spots automatically (Recommended)
                  </label>
                </div>

                <div className="signature-section">
                  {/* Signature 1: Sub-Contractor Training */}
                  <div className={`signature-box ${signatures.training ? 'signed' : ''}`}>
                    <div className="signature-title">1. Sub-Contractor Training Signature</div>
                    {signatures.training ? (
                      <>
                        <span className="signed-badge"><CheckCircle size={12} /> Signed</span>
                        <img src={signatures.training} alt="Training Signature" className="signature-preview-img" />
                      </>
                    ) : (
                      <div className="signature-pad-container">
                        <SignatureCanvas 
                          penColor="black" 
                          canvasProps={{ className: 'sigCanvas' }} 
                          ref={sigPadTraining}
                          onEnd={() => handleSignatureEnd('training', sigPadTraining)}
                        />
                      </div>
                    )}
                    <div className="signature-actions">
                      <button 
                        type="button" 
                        onClick={() => handleClearSignature('training', sigPadTraining)} 
                        className="btn btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Signature 2: Handbook */}
                  <div className={`signature-box ${signatures.handbook ? 'signed' : ''}`}>
                    <div className="signature-title">2. Handbook & Policies Signature</div>
                    {signatures.handbook ? (
                      <>
                        <span className="signed-badge"><CheckCircle size={12} /> Signed</span>
                        <img src={signatures.handbook} alt="Handbook Signature" className="signature-preview-img" />
                      </>
                    ) : (
                      <div className="signature-pad-container">
                        <SignatureCanvas 
                          penColor="black" 
                          canvasProps={{ className: 'sigCanvas' }} 
                          ref={sigPadHandbook}
                          onEnd={() => handleSignatureEnd('handbook', sigPadHandbook)}
                        />
                      </div>
                    )}
                    <div className="signature-actions">
                      <button 
                        type="button" 
                        onClick={() => handleClearSignature('handbook', sigPadHandbook)} 
                        className="btn btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Signature 3: Tooling */}
                  <div className={`signature-box ${signatures.tooling ? 'signed' : ''}`}>
                    <div className="signature-title">3. Tooling Requirements Signature</div>
                    {signatures.tooling ? (
                      <>
                        <span className="signed-badge"><CheckCircle size={12} /> Signed</span>
                        <img src={signatures.tooling} alt="Tooling Signature" className="signature-preview-img" />
                      </>
                    ) : (
                      <div className="signature-pad-container">
                        <SignatureCanvas 
                          penColor="black" 
                          canvasProps={{ className: 'sigCanvas' }} 
                          ref={sigPadTooling}
                          onEnd={() => handleSignatureEnd('tooling', sigPadTooling)}
                        />
                      </div>
                    )}
                    <div className="signature-actions">
                      <button 
                        type="button" 
                        onClick={() => handleClearSignature('tooling', sigPadTooling)} 
                        className="btn btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Signature 4: Declaration */}
                  <div className={`signature-box ${signatures.declaration ? 'signed' : ''}`}>
                    <div className="signature-title">4. Contractor Declaration Signature</div>
                    {signatures.declaration ? (
                      <>
                        <span className="signed-badge"><CheckCircle size={12} /> Signed</span>
                        <img src={signatures.declaration} alt="Declaration Signature" className="signature-preview-img" />
                      </>
                    ) : (
                      <div className="signature-pad-container">
                        <SignatureCanvas 
                          penColor="black" 
                          canvasProps={{ className: 'sigCanvas' }} 
                          ref={sigPadDeclaration}
                          onEnd={() => handleSignatureEnd('declaration', sigPadDeclaration)}
                        />
                      </div>
                    )}
                    <div className="signature-actions">
                      <button 
                        type="button" 
                        onClick={() => handleClearSignature('declaration', sigPadDeclaration)} 
                        className="btn btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Nav Row */}
            <div className="button-row">
              {activeStep > 1 ? (
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  <ArrowLeft size={18} /> Back
                </button>
              ) : (
                <div></div> // placeholder to push Next to right
              )}

              {activeStep < STEPS.length ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next Step <ArrowRight size={18} />
                </button>
              ) : (
                <button type="submit" className="btn btn-success">
                  <Download size={18} /> Generate & Download Signed PDF
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
