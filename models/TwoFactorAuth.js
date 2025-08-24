const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TwoFactorAuth = sequelize.define('TwoFactorAuth', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  two_factor_secret: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  recovery_codes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of recovery codes'
  },
  enabled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'two_factor_auth',
  timestamps: false
});

module.exports = TwoFactorAuth;
