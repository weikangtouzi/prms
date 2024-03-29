'use strict';
const {
    Model, Deferrable
} = require('sequelize');
const worker = require('./worker');
module.exports = (sequelize, DataTypes) => {
    class Prologue extends Model {
        static associate(models) {
            // define association here
        }
    };
    Prologue.init({
        worker_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "worker",
                key: "id",
                deferrable: Deferrable.NOT
            }
        },
        content: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        Intelligent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Prologue',
        tableName: 'prologue',
    })
    return Prologue;
}