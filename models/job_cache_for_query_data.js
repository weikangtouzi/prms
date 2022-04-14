'use strict';
const {
    Model, Deferrable
} = require('sequelize');
const worker = require('./worker');
module.exports = (sequelize, DataTypes) => {
    class JobCache extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    JobCache.init({
        job_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "job",
                key: "id"
            }
        },
        worker_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        hr_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hr_pos: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(40),
            allowNull: false
        },
        category: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
        address_coordinate: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: false
        },
        address_description: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true
        },
        min_salary: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        max_salary: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        min_experience: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        min_education: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ontop: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        full_time_job: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "FullTime"
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING(15)),
            allowNull: true
        },
        comp_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        comp_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        comp_size: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        comp_financing: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expired_at: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        logo: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_avaliable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'JobCache',
        tableName: 'job_cache',
        createdAt: false,
        updatedAt: false
    });
    return JobCache;
};