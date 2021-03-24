const express = require('express')

const {
  checkPresence, getMe, updateMe
} = require("../controllers/user.js")

const router = express.Router()


router.get('/me/bg', checkPresence)
router.get('/me/profile-photo', checkPresence)
router.post('/me/bg', checkPresence)
router.post('/me/profile-photo', checkPresence)
router.delete('/me/bg', checkPresence)
router.delete('/me/profile-photo', checkPresence)

router.get('/check-presence', checkPresence)
router.get('/me', getMe)
router.put('/me', updateMe)
router.delete('me', checkPresence) // need password, written-passphrase, otp verification, token, and recupe mechanism with ttl of 3 months

module.exports = router