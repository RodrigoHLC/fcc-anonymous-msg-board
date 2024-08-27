'use strict';
// ======== SETTING UP MONGO AND BCRYPT =========
require("dotenv").config() 
const bcrypt = require("bcrypt")
// const bodyParser = require("body-parser") // ALREADY IN server.js
const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})

// ===== THREAD SCHEMA ======
const threadSchema = new mongoose.Schema({
  text: {type: String, required: true},
  delete_password: {type: String, required: true},
  // created_on: {type: Date, default: Date.now()}, // DOESN'T WORK
  // bumped_on: {type: Date, default: Date.now()},  // DOESN'T WORK
  created_on: {type: String},
  bumped_on: {type: String},
  // created_on: {type: Date},
  // bumped_on: {type: Date},
  reported: {type: Boolean, default: false},
  replies: {type: Array, default: []},
  
  board: {type: String, required:true}
}) // ===== END OF THREAD SCHEMA ======
let Thread = mongoose.model("Thread", threadSchema)  
// ======= START OF createThread() FUNCTION ===========
const createThread = async (text, delete_password, board) =>{
  // console.log("1) createThread() working")
  // console.log("2) Hashing password")
  try{
    const hashedPassword = await bcrypt.hash(delete_password, 10);
    // console.log("3) Hash successful: ", hashedPassword.slice(0,10))

    let response = await new Thread({text: text, delete_password: hashedPassword, board: board, created_on: new Date(Date.now()), bumped_on: new Date(Date.now())}).save()
    // console.log("4) thread document created. _id: ", response._id)
    // console.log("5) response: ", response)
    return response
    // new Thread({text: text, delete_password: hashedPassword, board: board, created_on: new Date(Date.now()), bumped_on: new Date(Date.now())}).save(
    //   (err, data)=>{
    //     if(err){console.error(err)}
        console.log("4) thread document created. _id: ", data._id)
    //     // done(null, data)
    //   })
  }catch(err){
    console.error(err)
  }
} //// ======= END OF createThread() FUNCTION ===========

// ===== REPLY SCHEMA =====
const replySchema = new mongoose.Schema({
  text: {type: String, required: true},
  delete_password: {type: String, required: true},
  // thread_id: {type: mongoose.Schema.Types.ObjectId, required: true},
  thread_id: {type: String, required: true},
  // created_on: {type: Date},
  created_on: {type: String},
  reported: {type: Boolean, default: false}
}) // ===== END OF REPLY SCHEMA ======
let Reply = mongoose.model("Reply", replySchema)

// ======= START OF createReply() FUNCTION ===========
const createReply = async (board, thread_id, text, delete_password) =>{
  // console.log("1) createReply() working")
  let replyObj = {};
  // console.log("2) createReply: Hashing password")
  try {
    let hashedPassword = await bcrypt.hash(delete_password, 10);
    // console.log("3) Password hashed: ", hashedPassword.slice(0,10))
    let data = await Reply.create({board: board, thread_id: thread_id, text: text, delete_password: hashedPassword, created_on: new Date(Date.now())})
    replyObj = {_id: data._id, text: data.text, created_on: data.created_on, delete_password: data.delete_password, reported: data.reported}
    // console.log("4) Reply created and saved to repliesDB. reply _id: ", data._id)
    // FIND THREAD AND PUSH THE REPLY INTO ITS replies ARRAY
    // console.log("5) Looking for Thread")
    let foundThread = await Thread.findById({_id: thread_id})
    // if(err){console.error(err)}
    // console.log("6) Thread found. replies.length: ", foundThread.replies.length)
    // console.log("7) Pushing replyObj and updating bumped_on")
    foundThread.replies.unshift(replyObj);
    foundThread.bumped_on = replyObj.created_on;
    foundThread = await foundThread.save()  // IS 'foundThread = ' NECESSARY? PROBABLY NOT
    // console.log("8) Thread document updated! replies.length: ", foundThread.replies.length)
    return data
  } catch(err) {
    console.error(err)
  }
} // ======== END OF createReply() FUNCTION ==========

// ===== EXPORTING SCHEMAS, MODELS, FUNCTIONS, AND APP ROUTING
module.exports = {
  threadSchema,
  Thread,
  createThread,
  replySchema,
  Reply,
  createReply,
  apiRoutes: function (app) { // ◘ ◘ BIG CHANGE: 'module.exports = function(app){}' TURNED TO 'module.exports = { apiRoutes : function(app){...}, threadSchema, Thread }'
  
  app.route('/api/threads/:board')
  .post(async (req, res, next)=>{
    // console.log("1) Request received")
    let board = req.params.board
    let text = req.body.text ;
    let delete_password = req.body.delete_password;
    // console.log(board)
    // console.log(text)
    // console.log(delete_password)
    try{
      let response = await createThread(text, delete_password, board)
      // console.log("let response: ", response)
      response = {
        "replies": response.replies,
        "_id": response._id,
        "text": response.text,
        "board": response.board,
        "created_on": response.created_on,
        "bumped_on": response.bumped_on
      }
      // console.log("process.cwd(): ", process.cwd())
      // console.log("__dirname:", __dirname)
      return res.send(response)
      // ↓ ↓ COULD NOT GET THE jQuery SCRIPT IN thread.html TO PROCESS THE DATA FROM THIS REQUEST ↓ ↓
      // return res.sendFile(process.cwd() + '/views/thread.html');
      // return res.redirect(process.cwd()+"/views/thread.html")
      // return res.redirect(`/api/replies/${response.board}?thread_id=${response._id}`)
      // return res.redirect(`/views/thread.html?thread_id=${response._id}`);
      // return res.sendFile(process.cwd()+`/views/thread.html?thread_id=${response._id}`);
      // res.render("../views/threads.html", {data: response})
    }catch(err){
      console.error(err);  return 
    }
  })
  .get((req, res)=>{
    let board = req.params.board
    let thread_id = req.query.thread_id
    if(thread_id){  // === RETURN A SPECIFIC THREAD ===
      try{ // === FIND THREAD ===
        Thread.findById({_id: thread_id}).select({reported: 0, delete_password: 0}).exec((err, foundThread)=>{
          if(err){console.error(err); return}
          // === SELECT WHICH INFORMATION TO DISPLAY FOR EACH REPLY (OMIT delete_password AND reported) ===
          foundThread.replies = foundThread.replies.map(reply => ({_id: reply._id, text: reply.text, created_on: reply.created_on}) )
          return res.json(foundThread)
        })
      } catch(err){
        console.error(err);  return 
      }
    } else if (!thread_id){ // === RETURN A BOARD WITH THE 10 MOST RECENTLY UPDATED THREADS
      try{ // === FIND ALL THREADS IN THE BOARD
        Thread.find({board: board}).sort({bumped_on: -1}).select({reported: 0, delete_password: 0, board:0 }).limit(10).exec((err, tenThreads)=>{
          if(err){console.error(err)}
          for(let thread of tenThreads){
            // === SELECT WHICH INFORMATION TO DISPLAY FOR EACH REPLY (OMIT delete_password AND reported) ===
            thread.replies = thread.replies.slice(0,3)  
            thread.replies = thread.replies.map(reply => ({_id: reply._id, text: reply.text, created_on: reply.created_on}))
          }
          return res.json(tenThreads)
        })
      } catch(err){
        console.error(err);  return 
      }
    }
  })
  .delete(async (req, res)=>{
    // You can send a DELETE request to /api/threads/{board} and pass along the thread_id & delete_password to delete the thread. Returned will be the string incorrect password or success.
    // console.log("1) Request to delete thread received")
    let board = req.params.board
    let thread_id = req.body.thread_id
    let delete_password = req.body.delete_password
    // console.log("2) ", board, thread_id, delete_password)
    try { // === FIND THREAD TO DELETE === 
      // console.log("3) Searching thread by _id")
      let foundThread = await Thread.findById({_id: thread_id})
      // console.log("4) Thread found, comparing passwords")
      // === COMPARE PROVIDED delete_password WITH STORED delete_password === 
      let comparison = await bcrypt.compare(delete_password, foundThread.delete_password)  
      if(comparison){ // === IF PASSWORD IS CORRECT
        // console.log("5) Password correct. Attempting to remove.")
        await Thread.findByIdAndRemove({_id: thread_id})
        // console.log("6) Thread removed!")
        return res.send("success")
        // ↓ ↓ USING await MAKES THIS CALLBACK UNNECESSARY ↓ ↓
        // Thread.findByIdAndRemove({_id: thread_id}, (err, removedThread)=>{
        //   if(err){console.error("Error deleting thread: ", err)}
          console.log("6) Thread removed!")
        //   res.send("success")
        // })
      }else{ // === IF PASSWORD IS INCORRECT
        // console.log("5) Password incorrect")
        return res.send("incorrect password")
      }
    } catch(err){console.error(err);  return }
    
  })
  .put((req, res)=>{
    // You can send a PUT request to /api/threads/{board} and pass along the thread_id. Returned will be the string 'reported'. The reported value of the thread_id will be changed to true.    
    // let board = req.params.board
    let thread_id = req.body.thread_id
    try{ // === FIND A SPECIFIC THREAD === 
      Thread.findById({_id: thread_id}, (err, foundThread)=>{
        if(err){console.error(err)}
        foundThread.reported = true // === ALTER ITS reported PROPERTY
        foundThread.save()
        return res.send("reported")
      })
    }catch(err){ // === IF THREAD NOT FOUND === 
      console.error(err);  return 
    }
  })
  
  app.route('/api/replies/:board')
  .post(async(req, res)=>{
    // You can send a POST request to /api/replies/{board} with form data including text, delete_password, & thread_id. This will update the bumped_on date to the comment's date. In the thread's replies array, an object will be saved with at least the properties _id, text, created_on, delete_password, & reported.
    let board = req.body.board;
    // let board = req.params.board; // THIS DOESN'T WORK, MESSES UP
    let thread_id = req.body.thread_id;
    let text = req.body.text;
    let delete_password = req.body.delete_password;
    try{ //=== createReply WILL ADD THE REPLY TO THE replies DB, AND ALSO PUSH IT INTO THE replies ARRAY OF THE THREAD IN THE threads DB
      await createReply(board, thread_id, text, delete_password)
      // console.log("await createReply() DONE ")
      Thread.findById({_id: req.body.thread_id}, (err, data)=>{
        if(err){console.error("Couldn't find. err: ", err)}
        // console.log("Looking for THREAD for final 'res.send()'")
        return  res.send(data)
      })
    } catch(err){
      console.error(err);  return 
    }
  })
  .get( (req, res) => {
    let board = req.params.board; // THE WEBSITE REQUIRES THIS FIELD TO BE FILLED, BUT IT'S UNUSED
    let thread_id = req.query.thread_id;
    Thread.findOne({_id: thread_id}).select("_id text board created_on bumped_on replies").exec((err, foundThread)=>{
      if(err){
        console.error(err)
        return res.send(err) // THIS 
      }
      // === SELECT WHICH INFORMATION TO DISPLAY FOR EACH REPLY (OMIT delete_password AND reported) ===
      foundThread.replies = foundThread.replies.map( reply => ( {"_id": reply._id, "text": reply.text, "created_on": reply.created_on }))
      // for(let reply of foundThread.replies){
      //   reply = {_id: reply.id, text: reply.text, created_on: reply.created_on}
      // }
      return res.json(foundThread)
    })
  })
  .delete( async (req, res) => {
    let board = req.params.board
    let thread_id = req.body.thread_id
    let reply_id = req.body.reply_id
    let delete_password = req.body.delete_password
    // console.log("1) looking for reply with _id: ", reply_id)
    try {
      let reply = await Reply.findOne({_id: reply_id})
      // console.log("2) reply found. Comparing password with hashed password")
      try { // === VERIFY IF PROVIDED delete_password MATCHES STORED delete_password
        if(await bcrypt.compare(delete_password, reply.delete_password)){
          // console.log("3) Password matches. Deleting text")
          reply.text = "[deleted]"
          await reply.save()
          // console.log("4) Comment deleted. reply.text: ", reply.text)
          try { // === ALSO LOOK FOR THREAD AND DELETE FROM THREAD === 
            // console.log("5) Now looking for thread")
            let thread = await Thread.findById({_id: thread_id})
            // console.log("6) Found thread: ", thread._id)
            // console.log("7) Looking through thread.replies")
            let index;
            // === BROWSE THREAD REPLIES === 
            for( let i=0; i <= thread.replies.length ; i++){
              // console.log(`8) index: ${i}, reply_id: ${thread.replies[i]._id}`)
              if( thread.replies[i]._id == reply_id ){
                // console.log(`9) Found a match! index: ${i}, text: ${thread.replies[i].text}`)
                // index = i
                thread.replies[i].text = "[deleted]"
                thread.markModified(`replies.${i}.text`);  // ◘ ◘ ◘ ◘ ATTENTION HERE ◘ ◘ ◘ ◘ 
                await thread.save()  // THE 'thread = ' IS PROBABLY UNNECESSARY
                break
              }else if(i == thread.replies.length){
                console.error(`9) Couldn't find a reply with _id: ${reply_id}`)
                return
              }
            }
            // console.log(`10) modified and saved thread.replies[${index}]:` , thread.replies[index].text)
            res.send("success")
          } catch(err){console.error(`Couldn't find thread with _id: ${thread_id}. Error: ${err}`)}
          // res.send("success")
        }else{
          return res.send("incorrect password")
        }
      } catch(err){console.error("Error comparing provided password and hash: ", err); return } 

    } catch (err) {console.error("Error looking for reply: ", err); return }
  })
  .put((req, res, next)=>{
    // You can send a PUT request to /api/replies/{board} and pass along the thread_id & reply_id. Returned will be the string reported. The reported value of the reply_id will be changed to true.
    // let board = req.params.board
    let thread_id = req.body.thread_id
    let reply_id = req.body.reply_id
    // === LOOK FOR REPLY TO ALTER ITS reported PROPERTY
    Reply.findById({_id: reply_id}, (err, foundReply)=>{
      if(err){console.error(err)}
      foundReply.reported = true
      foundReply.save()
      next()  // JUST TRYING SOMETHING DIFFERENT TO GET A LITTLE MORE PRACTICE
    })
  }, (req, res)=>{ // === ALSO LOOK FOR THREAD WHERE REPLY WAS POSTED === 
    Thread.findById({_id: req.body.thread_id}, (err, foundThread)=>{
      if(err){console.error(err)}
      // === BROWSE THROUGH replies ARRAY
      for(let i=0 ; i < foundThread.replies.length ; i++){
        if(foundThread.replies[i]._id == req.body.reply_id ){
          foundThread.replies[i].reported = true;
          foundThread.markModified(`replies.${i}.reported`); // ◘ ◘ ◘ ◘ ATTENTION HERE ◘ ◘ ◘ ◘ 
          break
        }else if(i == foundThread.replies.length){
          console.error("No reply matched the provided _id"); return
        }
      }
      foundThread.save((err, reportedThread)=>{
        if(err){console.error(err); return }
        return res.send("reported")  
      })
    })
  })
}
}
