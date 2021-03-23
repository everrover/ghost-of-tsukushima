/***
 * 1. Create user
 * 2. Delete user
 * 3. Update username
 * 4. Get user data except password
 * 5. Reset & change password
 * 6. Fetch all users- admin
 */
const LOG = require("../utils/log.js")
const { checkIfPresent, findOneUser, findUserProfile, validateExistingUserSigninToken } = require("../handlers")
const { message } = require("../utils/messageGenerator")
const { errorHandlerMiddleware } = require('../decorator/errorHandler')
const clean = require("../utils/clean.js")

const checkPresence = async(req, res, next) => {
  const {username, email} = req.query
  LOG.info("[checkPresence] Request received! Params: ", username, email)
  const response = checkIfPresent(username, email)
  LOG.info("[checkPresence] Sending response!", response)

  if(response.status){
    return res.status(200).send(response)
  }else{
    return res.status(500).send(response)
  }
}

const getMe = async(req, res, next) => {
  const {username} = req.body
  const token = req.headers.authorization
  LOG.info("[getMe] Request received! Params: ", username, "token")

  const requestingUser = token? (await validateExistingUserSigninToken(token)): null
  if(token && (!requestingUser || !requestingUser.status)){
    return res.status(403).send(requestingUser)
  }
  LOG.info("[getMe] Fetched requesting user!!", requestingUser)

  const requestedUser = await findOneUser({username, profile_id_reqd: true})
  if(!requestedUser || !requestedUser.status){
    return res.status(400).send(requestedUser)
  }
  const {user_id, profile_id} = requestedUser.body
  LOG.info("[getMe] Fetched requested user!!", requestedUser, user_id, profile_id)
  const requestedUserProfile = await findUserProfile({user_id, profile_id})
  if(!requestedUserProfile || !requestedUserProfile.status){
    return res.status(400).send(requestedUserProfile)
  }
  LOG.info("[getMe] Fetched requested user profile!!", requestedUserProfile)
  console.log(requestedUser, requestingUser)

  if(requestedUser.body.is_public || (token && requestedUser.body.user_id === requestingUser.body.user_id)){
    const response = {
      ...requestedUser.body,
      name: requestedUserProfile.body.name
    }
    response["createdAt"] = null
    response["updatedAt"] = null
    return res.status(200).send(message(true, "Private user profile information fetched!", clean(response)))
  }else {
    return res.status(200).send(message(true, "User profile fetched!", {...requestedUserProfile.body, ...requestedUser.body}))
  }
}

const deleteMe = async(req, res, next) => {
  const {username, email} = req.query
  LOG.info("[checkPresence] Request received! Params: ", username, email)
  const response = checkIfPresent(username, email)
  LOG.info("[checkPresence] Sending response!", response)

  if(response.status){
    return res.status(200).send(response)
  }else{
    return res.status(500).send(response)
  }
}

const updateMe = async(req, res, next) => {
  const {username, email} = req.query
  LOG.info("[checkPresence] Request received! Params: ", username, email)
  const response = checkIfPresent(username, email)
  LOG.info("[checkPresence] Sending response!", response)

  if(response.status){
    return res.status(200).send(response)
  }else{
    return res.status(500).send(response)
  }
}


module.exports = {
  getMe: errorHandlerMiddleware(getMe),
  deleteMe: errorHandlerMiddleware(deleteMe),
  updateMe: errorHandlerMiddleware(updateMe),
  checkPresence: errorHandlerMiddleware(checkPresence),
}