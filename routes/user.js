const express = require('express')

const {
  createProfilePhoto, checkPresence, getMe,
  updateMe, deleteMe, createBG,
  deleteProfilePhoto,
  checkIfBGExists, checkIfProfileExists, deleteBG
} = require("../controllers/user.js")
const {
  verifyFileUploader, createFile, verifyFileOwner, deleteFile
} = require("../controllers/file.js")
const {
  upload
} = require("./file")

const router = express.Router()

router.put('/me/bg', [
  verifyFileUploader, 
  checkIfBGExists,
  upload.single("media"),
  createBG,
  createFile
])
router.put('/me/profile-photo', [
  verifyFileUploader, 
  checkIfProfileExists,
  upload.single("media"),
  createProfilePhoto,
  createFile
])
router.post('/me/bg/:filename', [
  verifyFileOwner,
  checkIfBGExists,
  upload.single("media"),
  (req, res, next)=> {req.moreToDo = true; req.isUpdate = true; next()},
  deleteBG,
  deleteFile,
  createBG,
  createFile
])
router.post('/me/profile-photo/:filename', [
  verifyFileOwner,
  checkIfProfileExists,
  upload.single("media"),
  (req, res, next)=> {req.moreToDo = true; req.isUpdate = true; next()},
  deleteProfilePhoto,
  deleteFile,
  createProfilePhoto,
  createFile
])
router.delete('/me/bg/:filename', [
  verifyFileOwner,
  checkIfBGExists,
  (req, res, next)=> {req.moreToDo = true; next()},
  deleteBG,
  deleteFile
])
router.delete('/me/profile-photo/:filename', [
  verifyFileOwner,
  checkIfProfileExists,
  (req, res, next)=> {req.moreToDo = true; next()},
  deleteProfilePhoto,
  deleteFile
])

router.get('/check-presence', checkPresence)
router.get('/me', getMe)
router.put('/me', updateMe)
router.delete('/me', deleteMe) // need password, written-passphrase, otp verification, token, and recupe mechanism with ttl of 3 months

module.exports = router