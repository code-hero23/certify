const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const Certificate = require('../models/Certificate');

// POST /api/certificates - Upload PDF and save metadata
router.post('/', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const { 
            client_name, 
            project_name, 
            rating, 
            recommendation, 
            remarks, 
            installation_incharge 
        } = req.body;

        const certificate = await Certificate.create({
            client_name,
            project_name,
            file_path: `/uploads/${req.file.filename}`,
            rating,
            recommendation,
            remarks,
            installation_incharge
        });

        res.status(201).json(certificate);
    } catch (error) {
        console.error('Error saving certificate:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/certificates - Fetch all certificates
router.get('/', async (req, res) => {
    try {
        const certificates = await Certificate.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(certificates);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
