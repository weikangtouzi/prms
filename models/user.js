'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    username: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        len: [6, 12],
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: {
          args: true,
          msg: 'must be a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    real_name: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    identified: {
      type: DataTypes.ENUM("None", "Failed", "Success"),
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: { value: true, msg: "only allowed image_url" },
      }
    },
    last_login_device_id: {
      type: DataTypes.STRING,
      defaultValue: "None"
    },
    gender: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isAdult(value) {
          if (value) {
            if (new Date().getFullYear() - new Date(value).getFullYear() < 18) {
              throw new Error('only allowed adults');
            }
          }
        }
      }
    },
    current_city: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    first_time_working: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    job_status: {
      type: DataTypes.ENUM("NoJobButNoJob", "NoJobButWantJob", "OnTheJob", "OnTheJobButLookingForAJob", "GraduatingStudent"),
      allowNull: true
    },
    employment_nature: {
      type: DataTypes.ENUM("Anytime", "LessThanTwoDays", "LessThanOneWeek", "LessThanTwoWeeks", "LessThanOneMonth", "MoreThanOneMonth"),
      allowNull: true
    },
    education: {
      type: DataTypes.ENUM("LessThanPrime", "Primary", "Junior", "High", "JuniorCollege", "RegularCollege", "Postgraduate", "Doctor"),
      allowNull: true
    },
    last_log_out_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};