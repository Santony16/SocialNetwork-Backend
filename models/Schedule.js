const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
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
  day_of_week: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    },
    comment: '0=Monday, 6=Saturday'
  },
  time_of_day: {
    type: DataTypes.TIME,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'schedules',
  timestamps: false
});

module.exports = Schedule;
