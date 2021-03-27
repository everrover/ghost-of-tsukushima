
const LOG = require("../utils/log.js")
const { validateExistingUserSigninToken, createFileHandler, 
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

    if(req.type === 'POST'){
      const {filename} = req.params
      const file = await getFileWithFilename(filename)
      LOG.info("[verify file uploader] File response", filename)
      if (!file && !file.status){
        return res.status(400).send(message(false, "The file for upload doesn't exist"))
      } else if (validationResponse.body.user_id !== file.body.user_id){
        return res.status(403).send(message(false, "The file owner must be same as uploader"))
      }

    }else{
      next() // go to next op if file creation request is there
    }
  } catch (e) {
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
  const {token, filename, ext, access} = getFileReq(req)
  LOG.info("[updateFile] req params rcv. ", filename, ext)

  const findFileResponse = await findFileHandler(filename)
  LOG.info("[updateFile] filename processed and findFileResponse rcv. ", findFileResponse)
  if(!findFileResponse || !findFileResponse.status){
    return res.status(500).send(findFileResponse)
  }

  const signinTokenValidationResponse = await validateExistingUserSigninToken(token)
  LOG.info("[updateFile] token processed and signinTokenValidationResponse rcv. ", signinTokenValidationResponse)
  if(!signinTokenValidationResponse || !signinTokenValidationResponse.status){
    return res.status(500).send(signinTokenValidationResponse)
  }else if(signinTokenValidationResponse.body.user_id !== findFileResponse.body.user_id){
    return res.status(403).send(message(false, "User not allowed to update the static resource, User is not the owner of resource."))
  }else{
    const updateFileResponse = await updateFileHandler(filename, signinTokenValidationResponse.body.user_id, access, ext)
    LOG.info("[updateFile] update file handler response rcv. ", updateFileResponse)
    if(!updateFileResponse || !updateFileResponse.status){
      return res.status.send(500).send(updateFileResponse)
    } 
    
    return res.status(200).send(updateFileResponse)
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
  const {token, filename} = getFileReq(req)
  LOG.info("[deleteFile] req params rcv. ", filename, token)

  const findFileResponse = await findFileHandler(filename)
  LOG.info("[deleteFile] filename processed and findFileResponse rcv. ", findFileResponse)
  if(!findFileResponse || !findFileResponse.status){
    return res.status(500).send(findFileResponse)
  }

  const signinTokenValidationResponse = await validateExistingUserSigninToken(token)
  LOG.info("[deleteFile] token processed and signinTokenValidationResponse rcv. ", signinTokenValidationResponse)
  if(!signinTokenValidationResponse || !signinTokenValidationResponse.status){
    return res.status(500).send(signinTokenValidationResponse)
  }else if(signinTokenValidationResponse.body.user_id !== findFileResponse.body.user_id){
    return res.status(403).send(message(false, "User not allowed to delete the static resource, User is not the owner of resource."))
  }else{
    const deleteFileResponse = await deleteFileHandler(filename, signinTokenValidationResponse.body.user_id)
    LOG.info("[deleteFile] delete file handler response rcv. ", deleteFileResponse)
    if(!deleteFileResponse || !deleteFileResponse.status){
      return res.status.send(500).send(deleteFileResponse)
    } 
    return res.status(200).send(deleteFileResponse)
  }

}

module.exports = {
  createFile: errorHandlerMiddleware(createFile), 
  updateFile: errorHandlerMiddleware(updateFile), 
  getFile: errorHandlerMiddleware(getFile), 
  deleteFile: errorHandlerMiddleware(deleteFile),
  verifyFileUploader
}