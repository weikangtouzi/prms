
const { sequelize, DataTypes } = require('./common');


module.exports = sequelize.define('town', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    town_id: {
        type: DataTypes.STRING(12),
        allowNull: false,
    },
    county_id: {
        type: DataTypes.STRING(12),
        allowNull: false,
    }
},{
    freezeTableName: true
});