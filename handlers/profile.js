const {UserProfile} = require("../models/dbConnect")
const {errorHandler} = require("../decorator/errorHandler")
const bcrypt = require('bcryptjs')
const CONFIGS = require('../configs/index');
const {message} = require("../utils/messageGenerator");

const createUserProfile = async ({name, profile_photo, nationality, bg_photo, dob, gender, user_id}) => {
  const userProfile = await UserProfile.create({
    name, profile_photo, gender,
    nationality, bg_photo, dob, user_id,
  })

  if(!userProfile){
    return message(false, "Unable to create userProfile")
  }else{
    return message(true, "created userProfile", userProfile.dataValues)
  }
}

const updateUserProfile = async ({name, profile_photo, nationality, bg_photo, dob, gender, user_id, profile_id}) => {
  if(!(profile_id)){
    return message(false, "profile_id must be present")
  }
  let userProfile = await UserProfile.findOne({where: {profile_id}})

  if(!userProfile){
    return message(false, "No user with profile_id found")
  }

  userProfile = await userProfile.update({
    name, profile_photo,
    nationality, bg_photo, dob, gender, user_id,
  })

  if(!userProfile){
    return message(false, "Unable to update user profile")
  }else{
    return message(false, "Updated user profile", userProfile.dataValues)
  }
}

// no need for deletion

const findUserProfile = async ({user_id, profile_id}) => {
  if(!(user_id || profile_id)){
    return message(false, "user_id or email or username must be provided for find op")
  }
  let userProfile = await UserProfile.findOne({where: {user_id, profile_id}})

  if(!userProfile){
    return message(false, "No userProfile found")
  }else{
    return message(true, "Found userProfile", userProfile.dataValues)
  }
}

const findAll = async ({name, nationality, dob, gender}) => {
  if(!(name || nationality || dob || gender)){
    return message(false, "some field for search must be provided")
  }
  const users = await UserProfile.findOne({where: {name, nationality, dob, gender}})

  if(users.isEmpty()){
    return message(false, "No users found")
  }else{
    return message(true, "Found users", users.dataValues)
  }
}

module.exports = {
  createUserProfile: errorHandler(createUserProfile),
  updateUserProfile: errorHandler(updateUserProfile),
  findUserProfile: errorHandler(findUserProfile),
  findAll: errorHandler(findAll),
}