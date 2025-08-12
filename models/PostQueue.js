const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostQueue = sequelize.define('PostQueue', {
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
  queued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  process_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date/time when the post should be processed'
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'post_queue',
  timestamps: false
});

module.exports = PostQueue;
