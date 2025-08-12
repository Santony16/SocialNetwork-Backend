const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocialAccount = sequelize.define('SocialAccount', {
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
  provider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Examples: twitter, facebook, linkedin.'
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'social_accounts',
  timestamps: false
});

module.exports = SocialAccount;
