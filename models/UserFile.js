const Sequelize = require('sequelize')

const generateUserFile = sequelize => UserFile = sequelize.define("tb_user_file", {
  file_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV1,
    allowNull: false,
    unique: true
  },
  is_deleted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    default: false,
  },
  user_id: {
    type: Sequelize.INTEGER,
  },
  file_name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  file_type: {
    type: Sequelize.STRING,
    allowNull: true
  },
  file_mime: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  file_size: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  access: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [["public", "private", "static"]]
    }
  }
})

module.exports = generateUserFile