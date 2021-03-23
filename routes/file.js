const express = require('express')
const multer = require('multer')

const upload = multer({
  dest: "../media/files/",
})

// const {
//   uploadHandler, uploadsHandler, checkUserFileAccess,
//   createFile, updateFile, getFile, deleteFile
// } = require("../controllers/file.js")

const router = express.Router()

// router.post('/', createFile)
// router.put('/:filename', updateFile)
// router.get('/:filename', getFile)
// router.delete('/:filename', deleteFile)

// router.get("/media/files", checkUserFileAccess, express.static("media/files/"))
// router.put("/media/upload", upload.single("media_file_"), uploadHandler)
// router.put("/media/uploads", upload.single("media_files_"), uploadsHandler)

module.exports = router

/**
 * Downloads handled using middleware fn getFileInfo
 * 
 Source: https://stackoverflow.com/questions/49993826/upload-files-and-request-protected-download-node-js

 Keep in mind: Everything in Express.js framework is treated as a piece of middleware. Order of code is important (i.e. how your app.use is wired in order). Each time a client access your application would go from the top of your app.js file until something could be returned.

First, a static route means the the content deliver through this given path (folder) is static. Typically, in the top head of app.js file, there is:

> app.use(express.static('./public', options));

In the above code, folder 'public' is set to be static. That is anything put into this folder (including the document put into its subfolder) is totally transparent to the public, so that you don't need to specify what have been put into this folder. When a client try to make a HTTP request to your server, Express will scan through the folder and return the document once the requested file could be found; if not, then it go through your next app.use.

Can assign multiple static routes. For example:

> app.use(express.static('./public, options));
> app.use(express.static('./file', options));

Your server will now scan the folder named after 'file' after nothing was found in './public' path, and try to find out the requested document.

*Here is the trick* you can play by replacing the above code as this:

> app.use('/file', checkIfTheUserHaveLogIn);
> app.use('/file', express.static('./file', options));

or

> app.use('/file', checkIfTheUserHaveLogIn, express.static('./file', options));

Here, I use '/file' as the first argument in app.use to specify a special path in the URL that have to be matched. 

Note, the checkIfTheUserHaveLogIn is a middleware function which serve as controller(function) to decide if allow the client to access the next level of the middleware (by calling next()), which is express.static('./file', options). You can redirect the client to login page, return unauthorized response or do something else in the checkIfTheUserHaveLogIn if the client isn't authorized.

In your code, you set a router to screen out the '/file' routing path to perform your authentication. However, because how the order of your middleware matters. It is actually trigger the static router first, and the document can be found, so that the file have been already returned to the requested client. Your middleware is actually never been reached. To avoid it, simply just follow what I was did before, setting another static route and point to a another folder (must not be a subfolder under the first transparent static router, i.e. not under ./public as in my example). Then it should works perfectly.

 */