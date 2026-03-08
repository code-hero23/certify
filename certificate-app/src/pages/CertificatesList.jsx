import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CertificatesList = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                // We'll rely on the global axios interceptor for the auth token
                const res = await axios.get('/api/certificates');
                setCertificates(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch certificates. Please ensure you are logged in.');
                setLoading(false);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchCertificates();
    }, [navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this certificate record?')) return;
        
        try {
            await axios.delete(`/api/certificates/${id}`);
            setCertificates(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting certificate', err);
            alert('Failed to delete certificate');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-[Poppins]">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-center space-x-4">
                        <img src="/logo.jpg" alt="Cookscape" className="h-10 object-contain" />
                        <h1 className="text-2xl font-bold text-gray-900">Generated Certificates</h1>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate('/generator')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E60000]"
                        >
                            Back to Generator
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60000]"></div>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates</h3>
                        <p className="mt-1 text-sm text-gray-500">No client has completed the form yet.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {certificates.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(cert.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{cert.client_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {cert.project_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    cert.rating === 'Excellent' ? 'bg-green-100 text-green-800' :
                                                    cert.rating === 'Good' ? 'bg-blue-100 text-blue-800' :
                                                    cert.rating === 'Not great' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {cert.rating || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                {cert.file_path ? (
                                                    <a 
                                                        href={cert.file_path} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">No PDF</span>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(cert.id)}
                                                    className="text-red-600 hover:text-red-900 ml-4"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificatesList;
