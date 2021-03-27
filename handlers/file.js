const {UserFile} = require("../models/dbConnect")
const {errorHandler} = require("../decorator/errorHandler")
const {message} = require("../utils/messageGenerator");
const { createNewFileName } = require("../utils/createName");
const LOG = require("../utils/log");

const findFileHandler = async (file_name) => {
  const userFile = await UserFile.findOne({
    attributes: ["user_id", "file_id", "file_name", "access"],
    where: { file_name, is_deleted: false }
  })

  if(!userFile){
    return message(false, "UserFile not found")
  }else{
    return message(true, "Found userFile", userFile.dataValues)
  }
}

const deleteFileHandler = async (file_name) => {
  const userFile = await UserFile.findOne({
    attributes: ["user_id", "file_id", "file_name", "access"],
    where: { file_name, is_deleted: false }
  })
  if(!userFile){
    return message(false, "Unable to delete userFile! Userfile requested for deletion not found!")
  }

  const deleteUserFile = await userFile.update({ is_deleted: true })
  if(!deleteUserFile){
    return message(false, "Unable to delete userFile")
  }else{
    return message(true, "Deleted userFile", userFile.dataValues)
  }
}

const createFileHandler = async (user_id, file_name, file_type, file_mime, file_size, access="public") => {
  LOG.info("createFileHandler | req rcv: ", user_id, file_name, file_type, file_mime, file_size, access)
  const userFile = await UserFile.create({
    is_deleted: false, user_id, file_name, file_mime, file_type, file_size, access
  })
  if(!userFile){
    return message(false, "Unable to CREATE userFile")
  }else{
    return message(true, "CREATED userFile", userFile.dataValues)
  }
}

const updateFileHandler = async (user_id, file_name, file_type, file_mime, file_size, access="public") => {
  LOG.info("updateFileHandler | req rcv: ", user_id, file_name, file_type, file_mime, file_size, access)
  const deleteFileResponse = await deleteFileHandler(file_name)
  if(!deleteFileResponse || !deleteFileResponse.status){
    return message(false, 'D: Unable to update user file')
  }
  const createFileResponse = await createFileHandler(user_id, file_name, file_type, file_mime, file_size, access)
  if(!createFileResponse || !createFileResponse.status){
    return message(false, 'C: Unable to update user file')
  }else{
    return message(true, 'Updated user file', createFileResponse.body)
  }
}



module.exports = {
  findFileHandler: errorHandler(findFileHandler),
  createFileHandler: errorHandler(createFileHandler),
  updateFileHandler: errorHandler(updateFileHandler),
  deleteFileHandler: errorHandler(deleteFileHandler),
}