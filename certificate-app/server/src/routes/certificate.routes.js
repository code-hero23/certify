const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const Certificate = require('../models/Certificate');
const ShortLink = require('../models/ShortLink');
const crypto = require('crypto');

// POST /api/certificates/shorten - Create a short link
router.post('/shorten', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ message: 'No data provided' });

        // Generate a random 6-character code
        const shortCode = crypto.randomBytes(4).toString('hex').slice(0, 6);
        
        const shortLink = await ShortLink.create({
            shortCode,
            data
        });

        res.status(201).json({ code: shortCode });
    } catch (error) {
        console.error('Error creating short link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/certificates/s/:code - Resolve a short link
router.get('/s/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const shortLink = await ShortLink.findOne({ where: { shortCode: code } });
        
        if (!shortLink) {
            return res.status(404).json({ message: 'Short link not found' });
        }

        res.json(shortLink.data);
    } catch (error) {
        console.error('Error resolving short link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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

// DELETE /api/certificates/:id - Delete a certificate
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.findByPk(id);

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Optional: Delete the file from the filesystem to save space
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../', certificate.file_path);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await certificate.destroy();
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
