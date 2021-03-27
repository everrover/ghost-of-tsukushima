
const LOG = require("../utils/log.js")
const path = require('path');
const { validateExistingUserSigninToken, createFileHandler, getRequestedFile, 
  deleteFileHandler, updateFileHandler, findFileHandler } = require('../handlers/index.js')
const { message } = require('../utils/messageGenerator')
const { errorHandlerMiddleware } = require('../decorator/errorHandler')
const clean = require("../utils/clean.js")

const verifyFileUploader = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    // LOG.info(token)
    if(!token){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    const validationResponse = await validateExistingUserSigninToken(token)
    LOG.info("[verify file uploader] Validation response: ", validationResponse)
    if(!validationResponse || !validationResponse.status){
      return res.status(403).send(message(false, "User token is invalid"))
    }
    req.user = {...validationResponse.body}
    next() // go to next op if file creation request is there
    
  } catch (e) {
    return res.status(500).send(message(false, "some internal error occurred"))
  }
}

const verifyFileOwner = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    const filename = req.params.filename
    // LOG.info(token)
    if(!token){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    if(!filename){
      return res.status(400).send(message(false, "Filename is obviously needed."))
    }
    LOG.info("[verifyFileOwner] req rcv: ", "token", filename)
    const validationResponse = await validateExistingUserSigninToken(token)
    LOG.info("[verify file owner] Validation response: ", validationResponse)
    if(!validationResponse || !validationResponse.status){
      return res.status(403).send(message(false, "User token is invalid"))
    }

    const fileRes = await findFileHandler(filename)
    LOG.info("[verify file owner] Find file response: ", fileRes)
    if(!fileRes || !fileRes.status){
      return res.status(400).send(message(false, "Req file not found"))
    }

    if(fileRes.body.user_id !== validationResponse.body.user_id){
      return res.status(403).send(message(false, "You aren't allowed to manage the file"))
    }

    // attach info to pass on
    req.user = {...validationResponse.body}
    req.reqFile = {...fileRes.body}
    next() // go to next op if file creation request is there
    
  } catch (e) {
    return res.status(500).send(message(false, "some internal error occurred"))
  }
}

const verifyFileGetter = async (req, res, next) => {
  try {
    const user = req.user
    const filename = req.params.filename

    if(!user){
      return res.status(400).send(message(false, "User wasn't verified!!"))
    }
    if(!filename){
      return res.status(400).send(message(false, "Filename is obviously needed."))
    }
    LOG.info('verifyFileGetter | req rcv: ', user, filename)

    const fileRes = await findFileHandler(filename)
    LOG.info("verifyFileGetter | File get response: ", fileRes)
    if(!fileRes || !fileRes.status){
      return res.status(400).send(message(false, "File not found due to some reason"))
    }

    if(fileRes.body.access === "public" || fileRes.body.access === 'static' || fileRes.body.user_id === user.user_id){
      LOG.info("verifyFileGetter | File access granted for", filename, "to user", user.user_id, "../media/files/"+filename)
      return res.status(200).sendFile(filename, {root:path.join(__dirname, '/../media/files')})
      // next() // when static wks
    }else{
      return res.status(403).send(message(false, "File is protected and can't be accessed by you!!"))
    }

  } catch (e) {
    LOG.error("[verifyFileGetter] Error occurred: ", e)
    return res.status(500).send(message(false, "some internal error occurred"))
  }
}

const createFile = async (req, res, next) => {
  try {
    // console.log(req)
    const user = req.user
    const file = req.file
    if(!user){
      return res.status(403).send(message(false, "User wasn;t verified and isn;t available!"))
    }
    if(!file){
      return res.status(500).send(message(false, "File wasn't created!"))
    }
    LOG.info("createFile | req rcv:", user, file)

    const createFileRes = await createFileHandler(user.user_id, file.filename, file.fieldname, file.mimetype, file.size, user.is_public? "public": "private")
    LOG.info("createFile | Create file response: ", createFileRes)
    if(!createFileRes || !createFileRes.status){
      return res.status(500).send(message(false, "Unable to create the file in database!"))
    }
    return res.status(200).send(message(true, "File added into the system!", createFileRes))
  } catch (e) {
    LOG.error("createFile | error occurred: ", e)
    return res.status(500).send(message(false, "Something went wrong"))    
  }
}

const updateFile = async (req, res, next) => {
  try {
    const user = req.user
    const filename =  req.reqFile.file_name
    const file = req.file
    if(!user){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    if(!filename){
      return res.status(400).send(message(false, "Filename is obviously needed."))
    }
    if(!file){
      return res.status(400).send(message(false, "Updated file is obviously needed."))
    }
    LOG.info("[update file] Request rcv: ", filename, file, user)

    const deleteFileRes = await deleteFileHandler(filename)
    LOG.info("[update file] File update response: ", deleteFileRes)
    if(!deleteFileRes || !deleteFileRes.status){
      return res.status(500).send(message(false, "File not deleted due to some reason"))
    }

    const createFileRes = await createFileHandler(user.user_id, file.filename, file.fieldname, file.mimetype, file.size, user.is_public? "public": "private")
    LOG.info("updateFile | Create file response: ", createFileRes)
    if(!createFileRes || !createFileRes.status){
      return res.status(500).send(message(false, "Unable to update the file in database!"))
    }
    return res.status(200).send(message(true, "File updated in the system!", createFileRes))
  } catch (e) {
    LOG.error("updateFile | error occurred: ", e)
    return res.status(500).send(message(false, "Something went wrong"))
  }
}

const deleteFile = async (req, res, next) => {
  try {
    // console.log(req)
    const filename = req.reqFile.file_name
    LOG.info("[deleteFile] req params rcv. ", filename)

    const deleteFileResponse = await deleteFileHandler(filename)
    LOG.info("[deleteFile] filename processed and findFileResponse rcv. ", deleteFileResponse)
    if(!deleteFileResponse || !deleteFileResponse.status){
      return res.status(500).send(deleteFileResponse)
    }
    return res.status(200).send(deleteFileResponse)
  } catch (e) {
    LOG.error("deleteFile | error occurred: ", e)
    return res.status(500).send(message(false, "Something went wrong"))
  }
}

module.exports = {
  createFile: errorHandlerMiddleware(createFile), 
  updateFile: errorHandlerMiddleware(updateFile), 
  deleteFile,
  verifyFileUploader, verifyFileGetter, verifyFileOwner
}