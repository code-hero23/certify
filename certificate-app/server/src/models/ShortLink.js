const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShortLink = sequelize.define('ShortLink', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    shortCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    data: {
        type: DataTypes.JSONB, // Postgres optimized JSON
        allowNull: false,
    }
}, {
    timestamps: true,
});

module.exports = ShortLink;
