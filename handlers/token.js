const {UserToken} = require("../models/dbConnect")
const {errorHandler} = require("../decorator/errorHandler")
const jwt = require('jsonwebtoken')
const {message} = require("../utils/messageGenerator");
const { findOneUser } = require("./user");
const configs = require("../configs/index");
const clean = require("../utils/clean");

const createUserToken = async (token, type, issued_time, ttl, expiration_time, user_id) => {
  const userToken = await UserToken.create({
    token, type, issued_time, ttl, expiration_time, user_id, is_deleted: false
  })

  if(!userToken){
    return message(false, "Unable to update userToken")
  }else{
    return message(true, "Created userToken", userToken.dataValues)
  }
}

const createSigninToken = async (user_id, email, username, role) => {
  const accSigninToken = jwt.sign({
    user_id ,email,
    username, role
  }, configs.secretKey, {expiresIn: configs.SIGNED_IN_TOKEN_TTL})

  const now = Date.now()
  const userToken = await createUserToken(accSigninToken, "signin", Date.now(), configs.SIGNED_IN_TOKEN_TTL*1000, now+configs.SIGNED_IN_TOKEN_TTL*1000, user_id)

  if(userToken.status){
    return message(true, "Created user signin Token", userToken.body)
  }else{
    return message(false, "Unable to CREATE user signin token")
  }
}

const createUserRegistrationToken = async ({user_id, email}) => {

  console.log(configs)
  const accVerificationToken = jwt.sign({
    user_id: user_id,
    email: email
  }, configs.secretKey, {expiresIn: configs.VERIFY_ACCOUNT_TOKEN_TTL})
  const now = Date.now()
  const userToken = await createUserToken(accVerificationToken, "verification", Date.now(), configs.VERIFY_ACCOUNT_TOKEN_TTL*1000, now+configs.VERIFY_ACCOUNT_TOKEN_TTL*1000, user_id)

  if(userToken.status){
    return message(true,  "Created user reg Token", userToken.body)
  }else{
    return message(false,"Unable to CREATE user registration token")
  }
}

const validateToken = async (token, type, to_delete=true) => {
  const decodedToken = jwt.decode(token, {json: true})
  let userToken = await UserToken.findOne({
    where: {
      user_id: decodedToken.user_id,
      token, type,
      is_deleted: false,
    }
  })
  if(!userToken){ // no token found
    return message(false, "User token doesn't exist.")
  }else if(userToken.expiration_time < Date.now()){ // token expired
    return message(false, "User token has expired! Please try registering with diff acc or after two hours")
  }
  userToken = await userToken.update({is_deleted: to_delete})
  if(!userToken){ // no token found
    return message(false, "User token after find wasn't updated to defined delete-status.")
  }else{
    return message(true, "User token was validated!", decodedToken)
  }
}

const deleteUserToken = async (token_id, token) => {
  let userToken = await UserToken.findOne({where: clean({token_id, token})})

  if(!userToken){
    return message(false, "No userToken with token_id found")
  }

  userToken = await userToken.update({
    is_deleted: true
  })

  if(!userToken){
    return message(false, "Unable to delete userToken")
  }else{
    return message(true, "Deleted userToken")
  }
}

const deleteExistingUserSigninToken = async (token) => {
  if(!token){
    return message(false, "token must be provided")
  }
  const decToken = await validateToken(token, "signin", true) // validate and delete token
  
  if(decToken && decToken.status){
    return message(true, "associated signin token was found and deleted!")
  }else{
    return message(false, 'unable to signout', decToken)
  }
}

const validateExistingUserSigninToken = async (token) => {
  if(!token){
    return message(false, "token must be provided")
  }
  const decToken = await validateToken(token, "signin", false) // validate
  if(!decToken || !decToken.status){
    return decToken
  }
  const assUser = await findOneUser({user_id: decToken.body.user_id, email: decToken.body.email})
  console.log(decToken.body)
  if(!assUser && !assUser.status){
    return message(false, "No userToken found")
  }else{
    return message(true, "Found userToken", {...assUser.body})
  }
}

const findUserToken = async (token_id, token, user_id, type) => {
  if(!(token_id || token || user_id || type)){
    return message(false, "either of token_id, token, user_id or type must be provided for find op")
  }
  let userToken = await UserToken.findOne({where: {token_id, token, user_id, type, is_deleted: false}})

  if(!userToken){
    return message(false, "No userToken found")
  }else{
    return message(true, "Found userToken", userToken.dataValues)
  }
}

const findExistingSigninToken = async (user_id) => {
  let oldUserToken = await UserToken.findOne({ where: { user_id, is_deleted: false, type: "signin" } })
  if(!oldUserToken){
    return message( false, "No old user signin token found for user!" )
  }else if(oldUserToken.expiration_time >= Date.now()){ // old token- not expired
      return message( true, "Old valid token entry found! Signin complete", { token: oldUserToken.token, expiration_time: oldUserToken.expiration_time })
  }else{
      await oldUserToken.update({is_deleted: true})
      message(false, "Old expired token entry found. Create new one plz. Old entry was deleted")
  }
}

const findAll = async (user_id, token, is_deleted=false, type) => {
  if(!(user_id || token || is_deleted || type)){
    return message(false, "some field for search must be provided")
  }
  const userTokens = await UserToken.findAll({where: {token, user_id, type, is_deleted}})

  if(userTokens.isEmpty()){
    return message(false, "No userTokens found")
  }else{
    return message(true, "Found userTokens", userTokens.dataValues)
  }
}

module.exports = {
  createUserToken: errorHandler(createUserToken),
  createUserRegistrationToken: errorHandler(createUserRegistrationToken),
  createSigninToken: errorHandler(createSigninToken),
  findExistingSigninToken: errorHandler(findExistingSigninToken),
  validateToken: errorHandler(validateToken),
  deleteUserToken: errorHandler(deleteUserToken),
  deleteExistingUserSigninToken: errorHandler(deleteExistingUserSigninToken),
  validateExistingUserSigninToken: errorHandler(validateExistingUserSigninToken),
  findUserToken: errorHandler(findUserToken),
  findAll: errorHandler(findAll),
}