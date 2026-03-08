import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GeneratorForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        clientName: '',
        projectName: '',
        address: '',
        designerName: '',
        engineerName: '',
        coordinatorName: '',
        installationIncharge: '', // Store the name for the certificate
        orderLoadingDate: '',
        deliveryDate: '',
        completionDate: ''
    });

    const inchargeOptions = [
        { name: 'John Doe', signature: '/signatures/john_doe.png' },
        { name: 'Jane Smith', signature: '/signatures/jane_smith.png' },
        { name: 'Arun Kumar', signature: '/signatures/arun_kumar.png' }
    ];

    const [generatedLink, setGeneratedLink] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateLink = (e) => {
        e.preventDefault();
        
        // Find the signature path for the selected incharge
        const selectedIncharge = inchargeOptions.find(opt => opt.name === formData.installationIncharge);
        const dataToEncode = {
            ...formData,
            inchargeSignature: selectedIncharge ? selectedIncharge.signature : ''
        };

        // Encode data to base64 to pass in URL
        const encodedData = btoa(JSON.stringify(dataToEncode));
        const link = `${window.location.origin}/client-form?data=${encodedData}`;
        setGeneratedLink(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center relative">
                    <button 
                        onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                        className="absolute top-0 right-0 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                        Logout
                    </button>
                    <img src="/logo.jpg" alt="Cookscape Logo" className="h-16 mb-4 object-contain" />
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                        Certificate Link Generator
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Fill in the details below to generate a unique link for the client.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleGenerateLink}>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client Name</label>
                            <input type="text" name="clientName" required value={formData.clientName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input type="text" name="projectName" required value={formData.projectName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea name="address" required value={formData.address} onChange={handleChange} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Designer Name</label>
                            <input type="text" name="designerName" required value={formData.designerName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Engineer Name</label>
                            <input type="text" name="engineerName" required value={formData.engineerName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Co-ordinator Name</label>
                            <input type="text" name="coordinatorName" required value={formData.coordinatorName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Order Loading</label>
                            <input type="date" name="orderLoadingDate" required value={formData.orderLoadingDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Delivery</label>
                            <input type="date" name="deliveryDate" required value={formData.deliveryDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Completion</label>
                            <input type="date" name="completionDate" required value={formData.completionDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Installation Incharge</label>
                            <select 
                                name="installationIncharge" 
                                required 
                                value={formData.installationIncharge} 
                                onChange={handleChange} 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select Incharge</option>
                                {inchargeOptions.map((opt) => (
                                    <option key={opt.name} value={opt.name}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150">
                            Generate Link
                        </button>
                    </div>
                </form>

                {generatedLink && (
                    <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200 animate-fade-in-up">
                        <h3 className="text-lg font-medium text-green-800 mb-2">Link Generated Successfully!</h3>
                        <div className="flex items-center">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="flex-1 block w-full border border-green-300 rounded-l-md shadow-sm py-2 px-3 bg-white text-gray-700 sm:text-sm"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedLink)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                            >
                                Copy
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-green-700">
                            Share this link with your client. They will use it to fill in their feedback and generate the final certificate.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratorForm;
