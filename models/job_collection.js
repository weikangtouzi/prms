'use strict';
const {
    Model, Deferrable
} = require('sequelize');
const user = require('./job');
module.exports = (sequelize, DataTypes) => {
    class JobCollection extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    JobCollection.init({
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "users",
                key: "id",
                deferrable: Deferrable.NOT
            }
        },
        job_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "job",
                key: "id",
                deferrable: Deferrable.NOT
            }
        }
    }, {
        sequelize,
        modelName: 'job_collection',
        tableName: 'JobCollection'
    });
    return JobCollection;
};