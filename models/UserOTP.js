const Sequelize = require('sequelize')

const generateUserOTP = (sequelize) => {
  const UserOTP = sequelize.define("tb_user_otp", {
    otp_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: Sequelize.INTEGER,
      unique: true
    },
    otp: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    attempt_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    ttl: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    }
  })

  return UserOTP
}

module.exports = generateUserOTP