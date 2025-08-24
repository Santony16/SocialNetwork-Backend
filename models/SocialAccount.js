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
    allowNull: false
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
    allowNull: true
  },
  provider_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  instance_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  connected_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'social_accounts',
  timestamps: false
});

module.exports = SocialAccount;
