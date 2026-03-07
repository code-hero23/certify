const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Certificate = sequelize.define('Certificate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    client_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    project_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rating: {
        type: DataTypes.STRING,
    },
    recommendation: {
        type: DataTypes.TEXT,
    },
    remarks: {
        type: DataTypes.TEXT,
    },
    installation_incharge: {
        type: DataTypes.STRING,
    }
}, {
    timestamps: true,
});

module.exports = Certificate;
