const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostHistory = sequelize.define('PostHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  social_account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_accounts',
      key: 'id'
    },
    onDelete: 'NO ACTION'
  },
  published_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Result of the post (API response)'
  }
}, {
  tableName: 'post_history',
  timestamps: false
});

module.exports = PostHistory;
