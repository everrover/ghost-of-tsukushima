
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
      return res.status(403).send(message(false, "You aren't allowed to update the file"))
    }
    next() // go to next op if file creation request is there
    
  } catch (e) {
    return res.status(500).send(message(false, "some internal error occurred"))
  }
}

const verifyFileGetter = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    const filename = req.params.filename

    if(!token){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    if(!filename){
      return res.status(400).send(message(false, "Filename is obviously needed."))
    }
    LOG.info("[get file validation] Request rcv: ", filename, "token-is-secret")

    const validationResponse = await validateExistingUserSigninToken(token)
    LOG.info("[get file validation] Validation response: ", validationResponse)
    if(!validationResponse || !validationResponse.status){
      return res.status(403).send(message(false, "User token is invalid"))
    }

    const fileRes = await findFileHandler(filename)
    LOG.info("[get file validation] File get response: ", fileRes)
    if(!fileRes || !fileRes.status){
      return res.status(400).send(message(false, "File not found due to some reason"))
    }

    if(fileRes.body.access === "public" || fileRes.body.access === 'static' || fileRes.body.user_id === validationResponse.body.user_id){
      LOG.info("getFileValidation | File access granted for", filename, "to user", validationResponse.body.user_id, "../media/files/"+filename)
      return res.status(200).sendFile(filename, {root:path.join(__dirname, '/../media/files')})
      // next() // when static wks
    }else{
      return res.status(403).send(message(false, "File is protected and can't be accessed by you!!"))
    }

  } catch (e) {
    LOG.error("[getFileValidation] Error occurred: ", e)
    return res.status(500).send(message(false, "some internal error occurred"))
  }
}

const getFileReq = (req) => {return clean({ext: req.query.ext, access: req.query.access, filename: req.params.filename, token: req.headers.authorization})}

const createFile = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    const file = req.file
    if(!token){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    LOG.info("createFile | req rcv:", "token-is-a-secret", file)

    const validationResponse = await validateExistingUserSigninToken(token)
    LOG.info("[createFile] Validation response: ", validationResponse)
    if(!validationResponse || !validationResponse.status){
      return res.status(403).send(message(false, "User token is invalid"))
    }
    const user = validationResponse.body

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
    const token = req.headers.authorization
    const filename =  req.params.filename
    const file = req.file
    if(!token){
      return res.status(400).send(message(false, "User must be logged in to upload files | No available token."))
    }
    if(!filename){
      return res.status(400).send(message(false, "Filename is obviously needed."))
    }
    LOG.info("[update file] Request rcv: ", filename, "token-is-secret")

    const validationResponse = await validateExistingUserSigninToken(token)
    LOG.info("[update file] Validation response: ", validationResponse)
    if(!validationResponse || !validationResponse.status){
      return res.status(403).send(message(false, "User token is invalid"))
    }

    const fileRes = await findFileHandler(filename)
    LOG.info("[update file] File update response: ", fileRes)
    if(!fileRes || !fileRes.status){
      return res.status(400).send(message(false, "File not found due to some reason"))
    }

    if(fileRes.body.user_id === validationResponse.body.user_id){
      const fileUpdateRes = await updateFileHandler(filename, user.user_id, file.filename, file.fieldname, file.mimetype, file.size, user.is_public? "public": "private")
      if(!fileUpdateRes || !fileUpdateRes.status){
        return res.status(500).send(message(false, "File not updated due to some reason"))
      }
      LOG.info("updateFile | File update res: ", fileUpdateRes)
      return res.status(200).send(message(true, "File updated!!"))
      // next() // when static wks
    }else{
      return res.status(403).send(message(false, "File is protected and can't be accessed by you!!"))
    }
  } catch (e) {
    LOG.error("updateFile | error occurred: ", e)
    return res.status(500).send(message(false, "Something went wrong"))
  }
}

const getFile = async (req, res, next) => {
  const {token, filename} = getFileReq(req)
  LOG.info("[getFile] req params rcv. ", filename, token)

  // handle public access
  const findFileResponse = await findFileHandler(filename)
  LOG.info("[getFile] filename processed and findFileResponse rcv. ", findFileResponse)
  if(!findFileResponse || !findFileResponse.status){
    return res.status(500).send(findFileResponse)
  }else if(findFileResponse && findFileResponse.body.access === 'public'){
    return res.status(200).send(findFileResponse)
  }

  // handle private access
  const signinTokenValidationResponse = await validateExistingUserSigninToken(token)
  LOG.info("[getFile] token processed and signinTokenValidationResponse rcv. ", signinTokenValidationResponse)
  if(!signinTokenValidationResponse || !signinTokenValidationResponse.status){
    return res.status(500).send(signinTokenValidationResponse)
  }else if(signinTokenValidationResponse.body.user_id !== findFileResponse.body.user_id){
    return res.status(403).send(message(false, "User not allowed to access the static resource. Resource is private and user is not the owner of resource."))
  }else{
    return res.status(200).send(findFileResponse)
  }
}

const deleteFile = async (req, res, next) => {
  try {
    const filename = req.params.filename
    LOG.info("[deleteFile] req params rcv. ", filename, token)

    const deleteFileResponse = await deleteFileHandler(filename)
    LOG.info("[deleteFile] filename processed and findFileResponse rcv. ", deleteFileResponse)
    if(!deleteFileResponse || !deleteFileResponse.status){
      return res.status(500).send(deleteFileResponse)
    }
    return res.status(200).send(deleteFileResponse)
  } catch (e) {
    LOG.error("updateFile | error occurred: ", e)
    return res.status(500).send(message(false, "Something went wrong"))
  }
}

module.exports = {
  createFile: errorHandlerMiddleware(createFile), 
  updateFile: errorHandlerMiddleware(updateFile), 
  getFile: errorHandlerMiddleware(getFile), 
  deleteFile: errorHandlerMiddleware(deleteFile),
  verifyFileUploader, verifyFileGetter, verifyFileOwner
}