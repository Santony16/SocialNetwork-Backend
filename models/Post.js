const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_instant: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '1: publicación inmediata'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'para publicaciones programadas'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'published', 'failed']]
    }
  }
}, {
  tableName: 'posts',
  timestamps: false
});

module.exports = Post;
