'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Comment.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reply_type: {
      type: DataTypes.ENUM("None", "Article", "Interview", "Comment", "Other"),
      allowNull: false
    },
    reply_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    stars: {
      type: DataTypes.ENUM("One", "Two", "Three", "Four", "Five"),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'comment'
  });
  return Comment;
};