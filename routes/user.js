const express = require('express')

const {
  createProfilePhoto, checkPresence, getMe,
  updateMe, deleteMe, createBG,
  checkIfBGExists, checkIfProfileExists
} = require("../controllers/user.js")
const {
  verifyFileUploader, createFile, verifyFileOwner
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
router.post('/me/bg', [
  verifyFileOwner,
  checkIfBGExists,
  upload.single("media"),
])
// router.post('/me/profile-photo', checkPresence)
// router.delete('/me/bg', checkPresence)
// router.delete('/me/profile-photo', checkPresence)

router.get('/check-presence', checkPresence)
router.get('/me', getMe)
router.put('/me', updateMe)
router.delete('/me', deleteMe) // need password, written-passphrase, otp verification, token, and recupe mechanism with ttl of 3 months

module.exports = router