/***
 * 1. Create user
 * 2. Delete user
 * 3. Update username
 * 4. Get user data except password
 * 5. Reset & change password
 * 6. Fetch all users- admin
 */
const LOG = require("../utils/log.js")
const { checkIfPresent, findOneUser, findUserProfile, updateUserProfile, validateExistingUserSigninToken, updateUserWithMap, deleteUserHandler, deleteUserToken, updateUserProfileNoClean } = require("../handlers")
const { message } = require("../utils/messageGenerator")
const { errorHandlerMiddleware } = require('../decorator/errorHandler')
const clean = require("../utils/clean.js")

const checkPresence = async(req, res, next) => {
  const {username, email, phone} = req.body
  LOG.info("[checkPresence] Request received! Params: ", username, email)
  const response = await checkIfPresent(username, email, phone)
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
      ...requestedUserProfile.body
    }
    response["createdAt"] = null
    response["updatedAt"] = null
    return res.status(200).send(message(true, "Private user profile information fetched!", clean(response)))
  }else {
    return res.status(200).send(message(true, "User profile fetched!", {...requestedUserProfile.body, ...requestedUser.body}))
  }
}

const deleteMe = async(req, res, next) => {
  const {username, password} = req.body
  const token = req.headers.authorization
  LOG.info("[deleteMe] Request received! Params: ", username, "password-is-a-secret", "token-is-a-secret")

  const requestingUser = token? (await validateExistingUserSigninToken(token)): null
  if(token && (!requestingUser || !requestingUser.status)){
    return res.status(403).send(requestingUser)
  }
  LOG.info("[updateMe] Fetched requesting user!!", requestingUser)

  const response = await deleteUserHandler(requestingUser.body.user_id)
  LOG.info("[DeleteMe] user deletion response", response)
  if(!response || !response.status){
    return res.status(400).send(response)
  }

  const tokenDeleteResponse = await deleteUserToken(null, token)
  if(!tokenDeleteResponse || !tokenDeleteResponse.status){
    return res.status(400).send(tokenDeleteResponse)
  }

  if(response && response.status){
    return res.status(200).send(response)
  }
}

const updateMe = async(req, res, next) => {
  const {username, phone, is_public, name, nationality, dob, gender} = req.body
  const token = req.headers.authorization
  LOG.info("[updateMe] Request received! Params: ", username, phone, is_public, name, nationality, dob, gender, "token")

  const requestingUser = token? (await validateExistingUserSigninToken(token)): null
  if(token && (!requestingUser || !requestingUser.status)){
    return res.status(403).send(requestingUser)
  }
  LOG.info("[updateMe] Fetched requesting user!!", requestingUser)
  const user_id = requestingUser.body.user_id
  const updatedUser = await updateUserWithMap(user_id, {username, phone, is_public})
  if(!updatedUser || !updatedUser.status){
    return res.status(400).send(updatedUser)
  }
  const profile_id = updatedUser.body.profile_id

  LOG.info("[updateMe] Fetched updated user!!", updatedUser, user_id, profile_id)
  const updatedUserProfile = await updateUserProfile(profile_id, {name, nationality, dob, gender})
  if(!updatedUserProfile || !updatedUserProfile.status){
    return res.status(400).send(updatedUserProfile)
  }
  LOG.info("[updateMe] Fetched updated user profile!!", updatedUserProfile)

  if(updatedUser.status || updatedUserProfile.status){
    const response = {
      ...updatedUser.body,
      ...updatedUserProfile.body
    }
    return res.status(200).send(message(true, "User updated!", clean(response)))
  }else {
    return res.status(500).send(message(false, "User not updated!"))
  }
}

const checkIfBGExists = async (req, res, next) => {
  try {
    
    const user = req.user
    LOG.info("[checkIfBGExists] Request received! Params: ", user)
    const user_id = user.user_id
    const foundUser = await findOneUser({user_id, profile_id_reqd: true})
    LOG.info("[checkIfBGExists] Found user: ", foundUser)
    if(!foundUser || !foundUser.status){
      return res.status(400).send(foundUser)
    }
    const profile_id = foundUser.body.profile_id

    const foundUserProfile = await findUserProfile({profile_id})
    LOG.info("[checkIfBGExists] Found user profile: ", foundUserProfile)
    if(foundUserProfile && foundUserProfile.status && foundUserProfile.body.bg_photo){
      if(req.method === 'PUT') {
        return res.status(400).send(message(false, "Profile BG already exists"))
      } else {
        req.user = foundUser.body
        req.changeProfilePhoto = true
        next() 
      }
    }else{
      if(req.method === 'POST' || req.method === 'DELETE') {
        return res.status(400).send(message(false, "Profile BG doesn't exists"))
      } else {
        req.user = foundUser.body
        req.changeProfilePhoto = true
        next() 
      }
    }
  } catch (e) {
    LOG.error("[checkIfBGExists] BG update error: ", e)
    return res.status(500).send(message(false, "Internal error occurred"))
  }
}

const createBG = async(req, res, next) => {
  try {
    const bg_photo = req.file.filename
    const profile_id = req.user.profile_id
    LOG.info("[createBG] Request received! Params: ", req.file, req.user)
    
    const updatedUserProfile = await updateUserProfile(profile_id, {bg_photo})
    LOG.info("[createBG] Fetched updated user profile!!", updatedUserProfile)
    if(!updatedUserProfile || !updatedUserProfile.status){
      return res.status(400).send(updatedUserProfile)
    }
    LOG.info("[createBG] BG updated in user profile!!")
    req.file = {...req.file, access: "static"}
    next()
    
  } catch (e) {
    LOG.error("[createBG] BG update error: ", e)
  }
}

const checkIfProfileExists = async (req, res, next) => {
  try {
    
    const user = req.user
    LOG.info("[checkIfProfileExists] Request received! Params: ", user)
    const user_id = user.user_id
    const foundUser = await findOneUser({user_id, profile_id_reqd: true})
    LOG.info("[checkIfProfileExists] Found user: ", foundUser)
    if(!foundUser || !foundUser.status){
      return res.status(400).send(foundUser)
    }
    const profile_id = foundUser.body.profile_id

    const foundUserProfile = await findUserProfile({profile_id})
    LOG.info("[checkIfProfileExists] Found user profile: ", foundUserProfile)
    if(foundUserProfile && foundUserProfile.status && foundUserProfile.body.profile_photo){
      if(req.method === 'PUT') {
        return res.status(400).send(message(false, "Profile Photo already exists"))
      } else {
        req.user = foundUser.body
        req.changeProfilePhoto = true
        next() 
      }
    }else{
      if(req.method === 'POST' || req.method === 'DELETE') {
        return res.status(400).send(message(false, "Profile Photo doesn't exists"))
      } else {
        req.user = foundUser.body
        req.changeProfilePhoto = true
        next() 
      }
    }
  } catch (e) {
    LOG.error("[checkIfProfileExists] BG update error: ", e)
    return res.status(500).send(message(false, "Internal error occurred"))
  }
}


const createProfilePhoto = async(req, res, next) => {
  try {
    const profile_photo = req.file.filename
    const profile_id = req.user.profile_id
    LOG.info("[createProfilePhoto] Request received! Params: ", req.file, req.user)
    
    const updatedUserProfile = await updateUserProfile(profile_id, {profile_photo})
    LOG.info("[createProfilePhoto] Fetched updated user profile!!", updatedUserProfile)
    if(!updatedUserProfile || !updatedUserProfile.status){
      return res.status(400).send(updatedUserProfile)
    }
    LOG.info("[createProfilePhoto] BG updated in user profile!!")
    req.file = {...req.file, access: "static"}
    next()
    
  } catch (e) {
    LOG.error("[createProfilePhoto] BG update error: ", e)
  }
}


const deleteBG = async(req, res, next) => {
  try {
    const bg_photo = req.reqFile.file_name
    const profile_id = req.user.profile_id
    LOG.info("[deleteProfileBG] Request received! Params: ", bg_photo, profile_id)
    
    const updatedUserProfile = await updateUserProfileNoClean(profile_id, {bg_photo: null})
    LOG.info("[deleteProfileBG] Fetched updated user profile!!", updatedUserProfile)
    if(!updatedUserProfile || !updatedUserProfile.status){
      return res.status(400).send(updatedUserProfile)
    }
    LOG.info("[deleteProfileBG] BG deleted in user profile!!")
    if(req.moreToDo) { next() }
    else { return res.status(200).send(message(true, 'Profile BG was deleted for '+req.user.user_id)) }
  } catch (e) {
    LOG.error("[deleteProfileBG] BG update error: ", e)
  }
}


const deleteProfilePhoto = async(req, res, next) => {
  try {
    const profile_photo = req.reqFile.file_name
    const profile_id = req.user.profile_id
    LOG.info("[deleteProfileBG] Request received! Params: ", profile_photo, profile_id)
    
    const updatedUserProfile = await updateUserProfileNoClean(profile_id, {profile_photo: null})
    LOG.info("[deleteProfileBG] Fetched updated user profile!!", updatedUserProfile)
    if(!updatedUserProfile || !updatedUserProfile.status){
      return res.status(400).send(updatedUserProfile)
    }
    LOG.info("[deleteProfileBG] BG deleted in user profile!!")
    if(req.moreToDo) { next() }
    else { return res.status(200).send(message(true, 'Profile BG was deleted for '+req.user.user_id)) }
  } catch (e) {
    LOG.error("[deleteProfileBG] BG update error: ", e)
  }
}



module.exports = {
  getMe: errorHandlerMiddleware(getMe),
  deleteMe: errorHandlerMiddleware(deleteMe),
  updateMe: errorHandlerMiddleware(updateMe),
  checkPresence: errorHandlerMiddleware(checkPresence),
  createBG, checkIfBGExists, checkIfProfileExists,
  createProfilePhoto, deleteBG, deleteProfilePhoto

}