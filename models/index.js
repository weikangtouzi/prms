'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable],
    {
      logging: false,
      ...config
    });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password,  {
    logging: false,
    ...config
  });
}
var sql_string = fs.readFileSync('./postgres_only_sql_code.sql', 'utf8');
sequelize.query(sql_string);
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Worker.belongsTo(db.User, {
  foreignKey: 'user_binding'
});
db.Worker.belongsTo(db.Enterprise, {
  foreignKey: "company_belonged"
})
db.User.hasOne(db.Worker, {
  foreignKey: 'user_binding'
})
db.Enterprise.hasMany(db.Worker, {
  foreignKey: 'company_belonged'
})
db.Province.hasMany(db.City, {
  foreignKey: 'province_id'
});
db.City.belongsTo(db.Province, {
  foreignKey: 'province_id'
})
db.City.hasMany(db.County, {
  foreignKey: 'city_id'
})
db.County.belongsTo(db.City, {
  foreignKey: 'city_id'
})
db.County.hasMany(db.Town, {
  foreignKey: 'county_id'
})
db.Town.belongsTo(db.County, {
  foreignKey: 'county_id'
})
db.Job.hasMany(db.Interview, {
  foreignKey: 'job_id'
})
db.Interview.belongsTo(db.Job, {
  foreignKey: 'job_id'
})
db.Worker.hasMany(db.Job, {
  foreignKey: 'worker_id'
})
db.Job.belongsTo(db.Worker, {
  foreignKey: 'worker_id'
})
module.exports = db;
