const {User} = require("../models/dbConnect")
const {errorHandler} = require("../decorator/errorHandler")
const bcrypt = require('bcryptjs')
const CONFIGS = require('../configs/index');
const {message} = require("../utils/messageGenerator");
const clean = require("../utils/clean");
const { use } = require("../mailer/transporter");

const createUser = async ({username, password, phone, email, profile_id}) => {
  const user = await User.create({
    username, email, phone,
    profile_id: profile_id,
    password: bcrypt.hashSync(password, CONFIGS.SALT_ROUNDS_NUMBER),
    role: "user", is_active: true, is_registered: false
  })

  if(!user){
    return message(false, "Unable to update user")
  }else{
    return message(true, "Created user", user.dataValues)
  }
}

const checkIfPresent = async (username, email, phone) => {
  const userWithEmail = await User.findOne({where: {email}})
  const userWithUsername = await User.findOne({where: {username}})
  const userWithPhone = phone? await User.findOne({where: {phone}}): null
  if(userWithPhone){
    return message(true, "User with phone present!")
  }else if(userWithEmail){
    return message(true, "User with email present!")
  }else if(userWithUsername){
    return message(true, "User with username present!")
  }else{
    return message(false, "User with email, phone or password absent")
  }
}

const verifyUserRegistration = async (user_id) => {
  if(!(user_id)){ return message(false, "User ID must be provided!") }
  let user = await User.findOne({where: {user_id, is_registered: false, is_active: true}})

  if(!user){ return message(false, "No user with user_id found") }
  user = await user.update({is_registered: true})

  if(!user){
    return message(false, "Unable to register user")
  }else{
    return message(true, "Registered user", user)
  }
}

const verifyUserPassword = async (username, email, password) => {
  if(!((username||email) && password)){ return message( false, "Password and username(or email) must be provided") }

  const user = await User.findOne({where: {username, is_active: true, is_registered: true}})
  if(!user){ return message( false, "Unable to find user: "+username, {}) }
  
  const passwordValid = await bcrypt.compareSync(password, user.password)
  if(!passwordValid){ return message( false, "Password invalid for user: "+username, {})}

  return message( true, "Password valid for user: "+username, {user_id: user.user_id, email: user.email})
}

const changeUserPassword = async (user_id, oldPassword, newPassword) => {
  if(!(user_id && oldPassword && newPassword)){
    return message( false, "Password and user_id must be provided")
  }

  const user = await User.findOne({where: {user_id, is_active: true, is_registered: true}})
    
  if(!user){ return message( false, "Unable to find active and registered user: "+user_id) }
  const passwordValid = await bcrypt.compareSync(oldPassword, user.password)
  if(!passwordValid){ return message( false, "Old password invalid for user!!")}

  const userAfterUpd = await user.update({
    password: bcrypt.hashSync(newPassword, CONFIGS.SALT_ROUNDS_NUMBER)
  })
  
  if(!userAfterUpd){
    return message(false, "Unable to update password for user", )
  }

  return message( true, "Password changed for user: "+user_id)
}

const updateUser = async (user_id, username, email, role) => {
  if(!(user_id)){
    return message(false, "User ID must be provided!")
  }
  let user = await User.findOne({where: {user_id, is_registered: true, is_active: true}})

  if(!user){
    return message(false, "No user with user_id found")
  }

  user = await user.update({
    username, role
  })

  if(!user){
    return message(false, "Unable to update user")
  }else{
    return message(false, "Updated user", user.dataValues)
  }
}

const deleteUser = async (user_id) => {
  if(!(user_id)){
    return message(false, "user_id must be provided for deletion")
  }
  let user = await User.findOne({where: {user_id, is_registered: true, is_active: true}})

  if(!user){
    return message(false, "No user with user_id found")
  }

  user = await user.update({is_active: false})

  if(!user){
    return message(false, "Unable to update user", user.dataValues)
  }else{
    return message(false, "Updated user")
  }
}

const findOneUser = async ({user_id, username=null, email}) => {
  if(!(user_id || email || username)){
    return message(false, "user_id or email or username must be provided for find op")
  }
  let user = await User.findOne({attributes: ["user_id", "username", "email", "role"], where: clean({user_id, username, email, is_active: true})})

  if(!user){
    return message(false, "No user found")
  }else{
    return message(true, "Found user", user.dataValues)
  }
}

const findAll = async (is_active, is_registered, role) => {
  if(!(is_active || is_registered || role)){
    return message(false, "some field for search must be provided")
  }
  const users = await User.findOne({attributes: {profile_id, user_id, username, email, role, is_registered, is_active}, where: {is_registered, role, is_active}})

  if(users.isEmpty()){
    return message(false, "No users found")
  }else{
    return message(true, "Found users", users.dataValues)
  }
}

module.exports = {
  createUser: errorHandler(createUser),
  checkIfPresent: errorHandler(checkIfPresent),
  verifyUserRegistration: errorHandler(verifyUserRegistration),
  verifyUserPassword: errorHandler(verifyUserPassword),
  changeUserPassword: errorHandler(changeUserPassword),
  deleteUser: errorHandler(deleteUser),
  updateUser: errorHandler(updateUser),
  findOneUser: errorHandler(findOneUser),
  findAll: errorHandler(findAll),
}