
const { sequelize, DataTypes } = require('./common');

module.exports = sequelize.define('county', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    county_id: {
        type: DataTypes.STRING(12),
        allowNull: false,
    },
    city_id: {
        type: DataTypes.STRING(12),
        allowNull: false,
    }
},{
    freezeTableName: true
});