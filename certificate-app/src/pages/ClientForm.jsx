import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ClientForm = () => {
    const location = useLocation();
    const [finalSignature, setFinalSignature] = useState(null);
    const [clientData, setClientData] = useState(null);

    const [feedbackData, setFeedbackData] = useState({
        recommendation: '',
        remarks: '',
        rating: ''
    });

    const [certificateAssets, setCertificateAssets] = useState({
        logo: null,
        bg: null,
        inchargeSignature: null
    });

    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPdf, setGeneratedPdf] = useState(null); // Switch to PDF

    const sigCanvas = useRef({});
    const certificateRef = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dataParam = params.get('data');
        if (dataParam) {
            try {
                const decodedString = atob(dataParam);
                const parsedData = JSON.parse(decodedString);
                setClientData(parsedData);
            } catch (err) {
                setError('Invalid link data. Please request a new link.');
            }
        } else {
            setError('No data found in the URL. Please use the generated link.');
        }
    }, [location]);

    const handleFeedbackChange = (e) => {
        const { name, value } = e.target;
        setFeedbackData(prev => ({ ...prev, [name]: value }));
    };

    // Helper to convert URL to Base64
    const toBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error("Failed to convert image to base64", url, err);
            return null;
        }
    };

    const loadAssets = async () => {
        if (clientData) {
            const [logoBase64, bgBase64, sigBase64] = await Promise.all([
                toBase64(encodeURI('/logo.jpg')),
                toBase64(encodeURI('/certificate-bg.png')),
                clientData.inchargeSignature ? toBase64(encodeURI(clientData.inchargeSignature)) : Promise.resolve(null)
            ]);
            setCertificateAssets({
                logo: logoBase64,
                bg: bgBase64,
                inchargeSignature: sigBase64
            });
        }
    };

    useEffect(() => {
        loadAssets();
    }, [clientData]);

    const allAssetsLoaded = certificateAssets.logo && certificateAssets.bg && 
        (!clientData?.inchargeSignature || certificateAssets.inchargeSignature);

    const handleGenerate = () => {
        if (!allAssetsLoaded) {
            alert("Images are still loading. Please wait a moment.");
            return;
        }
        if (!feedbackData.rating) {
            alert("Please select a rating.");
            return;
        }
        if (sigCanvas.current.isEmpty()) {
            alert("Please provide your signature.");
            return;
        }

        setIsGenerating(true);
        // Using getCanvas() instead of getTrimmedCanvas() to avoid Vite/ESM interop bugs in the library
        const sigData = sigCanvas.current.getCanvas().toDataURL('image/png');
        setFinalSignature(sigData);
    };

    useEffect(() => {
        if (isGenerating && finalSignature) {
            const capture = async () => {
                try {
                    const element = certificateRef.current;
                    
                    // Critical delay to ensure both state update and image rendering are finished
                    await new Promise(r => setTimeout(r, 2000));

                    const canvas = await html2canvas(element, {
                        scale: 2, 
                        useCORS: true,
                        logging: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        imageTimeout: 30000,
                        width: 1024,
                        height: 768,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: 1024,
                        windowHeight: 768,
                        onclone: (clonedDoc) => {
                            const clonedElement = clonedDoc.getElementById('certificate-capture-container');
                            if (clonedElement) {
                                clonedElement.style.position = 'relative';
                                clonedElement.style.display = 'block';
                                clonedElement.style.left = '0';
                                clonedElement.style.top = '0';
                                clonedElement.style.visibility = 'visible';
                                clonedElement.style.opacity = '1';
                            }
                        }
                    });

                    const imgData = canvas.toDataURL('image/png');

                    // Create PDF
                    const pdf = new jsPDF('landscape', 'pt', 'a4');
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    
                    // Upload to backend
                    const pdfBlob = pdf.output('blob');
                    const formData = new FormData();
                    formData.append('pdf', pdfBlob, `Certificate_${clientData.clientName.replace(/\s+/g, '_')}.pdf`);
                    formData.append('client_name', clientData.clientName);
                    formData.append('project_name', clientData.projectName);
                    formData.append('rating', feedbackData.rating);
                    formData.append('recommendation', feedbackData.recommendation);
                    formData.append('remarks', feedbackData.remarks);
                    formData.append('installation_incharge', clientData.installationIncharge);

                    try {
                        const response = await fetch('/api/certificates', {
                            method: 'POST',
                            body: formData
                        });
                        if (!response.ok) throw new Error('Failed to upload certificate');
                        console.log('Certificate uploaded successfully');
                    } catch (uploadError) {
                        console.error('Error uploading certificate:', uploadError);
                    }

                    pdf.save(`Certificate_${clientData.clientName.replace(/\s+/g, '_')}.pdf`);
                    setIsGenerating(false);
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    setGeneratedPdf({ url: pdfUrl, name: `Certificate_${clientData?.clientName || 'Client'}.pdf` });
                } catch (err) {
                    console.error("Error generating certificate", err);
                    alert("There was an error generating the certificate.");
                } finally {
                    setIsGenerating(false);
                }
            };
            capture();
        }
    }, [isGenerating, finalSignature]);

    const downloadCertificate = () => {
        const link = document.createElement('a');
        link.download = generatedPdf.name;
        link.href = generatedPdf.url;
        link.click();
    };

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold p-4">{error}</div>;
    }

    if (!clientData) {
        return <div className="min-h-screen flex items-center justify-center font-bold p-4">Loading data...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
            {!generatedPdf ? (
                <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-white px-6 py-4 flex flex-col items-center border-b border-gray-100">
                        <img src="/logo.jpg" alt="Cookscape Logo" className="h-16 mb-2 object-contain" />
                        <h2 className="text-xl font-bold text-gray-800 text-center">Installation Completed Feedback Form</h2>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="md:col-span-2 text-lg font-semibold text-gray-800 border-b pb-2">Project Details</h3>
                            <div><span className="font-medium text-gray-600">Client Name:</span> <span className="text-gray-900">{clientData.clientName}</span></div>
                            <div><span className="font-medium text-gray-600">Project Name:</span> <span className="text-gray-900">{clientData.projectName}</span></div>
                            <div className="md:col-span-2"><span className="font-medium text-gray-600">Address:</span> <span className="text-gray-900">{clientData.address}</span></div>
                            <div><span className="font-medium text-gray-600">Designer:</span> <span className="text-gray-900">{clientData.designerName}</span></div>
                            <div><span className="font-medium text-gray-600">Engineer:</span> <span className="text-gray-900">{clientData.engineerName}</span></div>
                            <div><span className="font-medium text-gray-600">Co-ordinator:</span> <span className="text-gray-900">{clientData.coordinatorName}</span></div>
                            <div><span className="font-medium text-gray-600">Loading Date:</span> <span className="text-gray-900">{clientData.orderLoadingDate}</span></div>
                            <div><span className="font-medium text-gray-600">Delivery Date:</span> <span className="text-gray-900">{clientData.deliveryDate}</span></div>
                            <div><span className="font-medium text-gray-600">Completion Date:</span> <span className="text-gray-900">{clientData.completionDate}</span></div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Why I will recommend Cookscape?</label>
                                <textarea
                                    name="recommendation"
                                    rows="3"
                                    value={feedbackData.recommendation}
                                    onChange={handleFeedbackChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Share your thoughts..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                                <textarea
                                    name="remarks"
                                    rows="3"
                                    value={feedbackData.remarks}
                                    onChange={handleFeedbackChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Any other remarks..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4">Kindly Rate the Conduct of Installation and the Team</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { value: 'Excellent', label: 'Excellent', sub: 'delivered more than expected' },
                                        { value: 'Good', label: 'Good', sub: 'but need improvements' },
                                        { value: 'Not great', label: 'Not great', sub: 'surely value for money' },
                                        { value: 'I am angry', label: 'I am angry', sub: "won't come back again" }
                                    ].map((option) => (
                                        <label 
                                            key={option.value} 
                                            className={`relative flex cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 group ${
                                                feedbackData.rating === option.value 
                                                ? 'border-red-500 bg-red-50 shadow-md' 
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <input 
                                                type="radio" 
                                                name="rating" 
                                                value={option.value} 
                                                onChange={handleFeedbackChange} 
                                                className="sr-only" 
                                            />
                                            <div className="flex items-start w-full gap-4">
                                                <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                    feedbackData.rating === option.value 
                                                    ? 'bg-red-500 border-red-500' 
                                                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                                                }`}>
                                                    {feedbackData.rating === option.value && (
                                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`block text-base font-bold transition-colors ${
                                                        feedbackData.rating === option.value ? 'text-red-700' : 'text-gray-900'
                                                    }`}>
                                                        {option.label}
                                                    </span>
                                                    <span className="mt-1 text-sm text-gray-500 leading-snug">
                                                        {option.sub}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-1 bg-gray-50 touch-none">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        canvasProps={{ className: 'w-full h-40 rounded-md cursor-crosshair' }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => sigCanvas.current.clear()}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                >
                                    Clear Signature
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 transition-all duration-200"
                                >
                                    {isGenerating ? 'Generating...' : 'Submit & Build Certificate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center">
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 w-full max-w-4xl" role="alert">
                        <p className="font-bold">Success</p>
                        <p>Your certificate has been generated.</p>
                    </div>

                    <div className="bg-white p-10 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center">
                        <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">PDF Ready for Download</h3>
                        <p className="text-gray-600 mb-6">Click the button below to save your certificate of installation.</p>
                        
                        <button
                            onClick={downloadCertificate}
                            className="flex justify-center py-3 px-8 border border-transparent rounded-full shadow-lg text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            Download Certificate PDF
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden Certificate Element for html2canvas */}
            <div style={{ 
                position: 'fixed', 
                left: '-10000px', 
                top: '0', 
                width: '1024px',
                zIndex: -1000, 
                visibility: 'visible',
                pointerEvents: 'none',
                backgroundColor: 'white'
            }}>
                <div
                    id="certificate-capture-container"
                    ref={certificateRef}
                    style={{
                        width: '1024px',
                        height: '768px',
                        backgroundColor: '#ffffff',
                        fontFamily: "'Poppins', sans-serif",
                        position: 'relative',
                        boxSizing: 'border-box',
                        color: '#111827',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Image Template */}
                    {certificateAssets.bg && (
                        <img
                            src={certificateAssets.bg}
                            alt="Background"
                            width="1024"
                            height="768"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1, zIndex: 0 }}
                        />
                    )}


                    {/* Interior Decorative Border (White Overlay for Legibility) */}
                    <div style={{
                        position: 'absolute',
                        inset: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        border: '1.5px solid rgba(229, 231, 235, 0.5)',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}></div>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '25px 40px 0 40px', position: 'relative', zIndex: 2 }}>
                        <div style={{ textAlign: 'left' }}>
                            <h1 style={{ margin: 0, color: '#e11d48', fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>CERTIFICATE OF INSTALLATION</h1>
                        </div>
                        {certificateAssets.logo && (
                            <img 
                                src={certificateAssets.logo} 
                                alt="Logo" 
                                style={{ height: '65px', width: 'auto', objectFit: 'contain', display: 'block' }} 
                            />
                        )}
                    </div>

                    {/* Project Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 30px', marginBottom: '25px', padding: '0 40px', position: 'relative', zIndex: 2 }}>
                        {[
                            { label: 'Name of the client:', value: clientData?.clientName },
                            { label: 'Project Name:', value: clientData?.projectName },
                            { label: 'Address:', value: clientData?.address },
                            { label: 'Designer Name:', value: clientData?.designerName },
                            { label: 'Engineer Name:', value: clientData?.engineerName },
                            { label: 'Co-ordinator Name:', value: clientData?.coordinatorName },
                            { label: 'Date of Order Loading:', value: clientData?.orderLoadingDate },
                            { label: 'Date of Delivery:', value: clientData?.deliveryDate },
                            { label: 'Date of Completion:', value: clientData?.completionDate },
                        ].map((item, idx) => (
                            <div key={idx} style={{ borderBottom: '1.5px solid #e5e7eb', paddingBottom: '4px' }}>
                                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px', fontWeight: '600' }}>{item.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{item.value || 'N/A'}</div>
                            </div>
                        ))}
                    </div>

                    {/* Feedback Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', padding: '0 40px', position: 'relative', zIndex: 2 }}>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', backgroundColor: 'rgba(249, 250, 251, 0.9)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Why I will recommend Cookscape?</div>
                            <div style={{ fontSize: '11px', lineHeight: '1.3', fontStyle: 'italic', color: '#4b5563' }}>"{feedbackData.recommendation || 'No recommendation provided.'}"</div>
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', backgroundColor: 'rgba(249, 250, 251, 0.9)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Remarks:</div>
                            <div style={{ fontSize: '11px', lineHeight: '1.3', fontStyle: 'italic', color: '#4b5563' }}>"{feedbackData.remarks || 'No remarks provided.'}"</div>
                        </div>
                    </div>

                    {/* Rating Section - Checkbox Style with Descriptions */}
                    <div style={{ padding: '0 30px', marginBottom: '25px', position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginBottom: '15px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Kindly Rate the Conduct of Installation and the Team
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    {[
                                        { label: 'Excellent', desc: 'delivered more than expected' },
                                        { label: 'Good', desc: 'but need improvements' },
                                        { label: 'Not great', desc: 'surely value for money' },
                                        { label: 'I am angry', desc: "won't come back again" }
                                    ].map((r) => (
                                        <td key={r.label} style={{ width: '25%', verticalAlign: 'top', padding: '0 5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                {/* Checkbox Container */}
                                                <div style={{ 
                                                    minWidth: '22px', 
                                                    width: '22px',
                                                    height: '22px', 
                                                    border: feedbackData.rating === r.label ? '2.5px solid #ed1c24' : '1.5px solid #666', 
                                                    backgroundColor: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    marginTop: '2px', // Precisely aligned with text top
                                                    boxSizing: 'border-box'
                                                }}>
                                                    {feedbackData.rating === r.label && (
                                                        <svg 
                                                            viewBox="0 0 24 24" 
                                                            fill="none" 
                                                            stroke="#ed1c24" 
                                                            strokeWidth="4.5" 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            style={{ width: '13px', height: '13px' }}
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {/* Text Container */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: '900', 
                                                        color: feedbackData.rating === r.label ? '#ed1c24' : '#666', 
                                                        marginBottom: '1px',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {r.label}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '10px', 
                                                        color: feedbackData.rating === r.label ? '#ed1c24' : '#888', 
                                                        lineHeight: '1.2', 
                                                        fontWeight: '500' 
                                                    }}>
                                                        {r.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Certificate Text */}
                    <div style={{ textAlign: 'center', marginBottom: '20px', padding: '0 40px', position: 'relative', zIndex: 2 }}>
                        <p style={{ fontSize: '14px', margin: '0 0 3px 0', color: '#374151' }}>I am pleased to Certify that the</p>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e11d48', margin: '3px 0' }}>COOKSCAPE KITCHEN / WARDROBE SYSTEM</h2>
                        <p style={{ fontSize: '14px', margin: '3px 0', color: '#374151' }}>has been installed in our Home to our Satisfaction</p>
                    </div>

                    {/* Signatures */}
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '35px', 
                        left: '0', 
                        right: '0', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '0 80px', 
                        zIndex: 10 
                    }}>
                        <div style={{ textAlign: 'center', width: '350px' }}>
                            <div style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #d1d5db',
                                borderBottom: '2.5px solid #ed1c24',
                                height: '85px', 
                                marginBottom: '12px', 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                {finalSignature && (
                                    <img 
                                        src={finalSignature} 
                                        alt="Client Signature" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                    />
                                )}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                SIGNATURE OF THE CLIENT ({clientData?.clientName || 'CLIENT'})
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', width: '350px' }}>
                            <div style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #d1d5db',
                                borderBottom: '2.5px solid #ed1c24',
                                height: '85px', 
                                marginBottom: '12px', 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                {certificateAssets.inchargeSignature && (
                                    <img 
                                        src={certificateAssets.inchargeSignature} 
                                        alt="Incharge Signature" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                    />
                                )}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                SIGNATURE OF INSTALLATION INCHARGE ({clientData?.installationIncharge || 'IN-CHARGE'})
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
