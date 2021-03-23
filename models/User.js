const Sequelize = require('sequelize')

const generateUser = (sequelize) => {
  const User = sequelize.define("tb_user", {
    user_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    profile_id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    password: {
      type: Sequelize.STRING(500),
      allowNull: false
    },
    is_public: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_registered: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isIn: [["admin", "user"]]
      }
    }
  })

  return User
}

module.exports = generateUser