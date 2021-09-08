const { sequelize, DataTypes } = require('./common');

module.exports = sequelize.define('province', {
    pro_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    province_id: {
        type: DataTypes.STRING(12),
        allowNull: false,
    }
},{
    freezeTableName: true
});