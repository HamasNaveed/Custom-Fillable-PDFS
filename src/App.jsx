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
  FileCheck
} from 'lucide-react';
import { generatePDF } from './utils/pdfGenerator';

const STEPS = [
  { id: 1, name: 'Personal Details', icon: User },
  { id: 2, name: 'Passport & RTW', icon: Stamp },
  { id: 3, name: 'Emergency Contacts', icon: Phone },
  { id: 4, name: 'Health & Criminal Check', icon: HeartPulse },
  { id: 5, name: 'Qualifications', icon: Award },
  { id: 6, name: 'Signatures & Submit', icon: PenTool }
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
      // Find the first signature that has been signed
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
              onClick={() => !success && setActiveStep(step.id)}
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
            
            {/* STEP 1: PERSONAL DETAILS */}
            {activeStep === 1 && (
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

            {/* STEP 2: PASSPORT & RIGHT TO WORK */}
            {activeStep === 2 && (
              <div>
                <h3 className="form-section-title"><Stamp size={20} /> Passport & Right To Work Check</h3>
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

            {/* STEP 3: EMERGENCY CONTACTS */}
            {activeStep === 3 && (
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

            {/* STEP 4: HEALTH & CRIMINAL CHECKS */}
            {activeStep === 4 && (
              <div>
                <h3 className="form-section-title"><HeartPulse size={20} /> Health and Safety</h3>
                <div className="form-grid" style={{ marginBottom: '2.5rem' }}>
                  <div className="form-group col-12">
                    <label style={{ fontSize: '0.95rem' }}>
                      Do you have any health issues or disabilities which could affect the project you work on? <span className="required">*</span>
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
                <div className="form-grid">
                  <div className="form-group col-12">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                      We are asking you to complete this section in relation to job roles which are not exempt from the Rehabilitation of Offenders Act 1974. For this reason, you are only required to disclose information about unspent convictions.
                    </p>
                    <label style={{ fontSize: '0.95rem' }}>
                      Do you have any unspent criminal convictions? <span className="required">*</span>
                    </label>
                    <div className="radio-group" style={{ maxWidth: '300px', marginTop: '0.5rem', marginBottom: '1rem' }}>
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
                      <label style={{ marginBottom: '0.5rem' }}>Provide details of unspent convictions (Up to 3):</label>
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
                </div>
              </div>
            )}

            {/* STEP 5: QUALIFICATIONS */}
            {activeStep === 5 && (
              <div>
                <h3 className="form-section-title"><Award size={20} /> Qualifications</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Insert details of any relevant Professional qualifications you hold (e.g. ESR, CSCS, ASD, etc.) (Up to 10):
                </p>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Qualification Type</th>
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

            {/* STEP 6: AGREEMENTS & SIGNATURES */}
            {activeStep === 6 && (
              <div>
                <h3 className="form-section-title"><PenTool size={20} /> Policies Acceptance & Contractor Sign-Off</h3>

                {/* Policies Checkboxes */}
                <div style={{ marginBottom: '2.5rem' }}>
                  
                  {/* 1. Subcontractor training acceptance */}
                  <div className="policy-card">
                    <h4>1. Sub-Contractor Training Agreement</h4>
                    <p>
                      I confirm that should I require any training whilst contracting for MJM Industrial, all training costs will be borne by me. If I leave or end my contract, I agree that MJM Industrial has the right to deduct any outstanding upfront training costs from my final invoice amount.
                    </p>
                    <div className="form-grid" style={{ marginBottom: '1rem' }}>
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
                    <h4>2. Handbook, Policies, and Manuals Acceptance</h4>
                    <p>
                      I confirm that I have read and understood the Handbook, Policies and Risk Assessments provided. I fully accept and agree to comply with the rules and conditions outlined in these documents.
                    </p>
                  </div>

                  {/* 3. Tooling Requirements acceptance */}
                  <div className="policy-card">
                    <h4>3. Tooling Requirements</h4>
                    <p>
                      I acknowledge and accept my responsibility to provide and maintain all tooling relevant to the project and my area of expertise.
                    </p>
                  </div>

                  {/* 4. Contractor Declaration */}
                  <div className="policy-card">
                    <h4>4. Contractor Declaration</h4>
                    <p>
                      I hereby confirm that the information given on this form is true and correct.
                    </p>
                    <div className="form-grid" style={{ marginBottom: '0rem' }}>
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
