const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mocha = require("mocha");
const before = mocha.before;
chai.use(chaiHttp);
let chai_thread_id
let chai_thread_id1
let chai_thread_id2
let chai_thread_id3
let reply_to_delete_id
let reply_to_report_id
let thread_to_delete_id;
let thread_to_report_id;
let thread_to_reply_to_id

const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
// ==== IMPORT MY CUSTOM MONGOOSE FUNCTIONALITY ====
const { threadSchema, Thread, createThread, replySchema, Reply, createReply} = require('../routes/api.js')

let separator
// ================ CHAI TESTS ================
suite('Functional Tests', function() {
    suite("Chai tests", ()=>{
        
        // ==== CREATE A THREAD TO BE REPORTED ====
        before( async () => {
            try{
                let threadToReport = await createThread("Thread to report", "delete", "chai_test_board")
                thread_to_report_id = threadToReport._id
                console.log("Created THREAD to be REPORTED: _id:", thread_to_report_id)
            } catch(err) {
                console.error("Error creating thread to be reported. err: ", err)
                return
            }

            // ↓ ↓ ↓ ↓  THIS OPTION WAS MISSING THE PASSWORD HASH FEATURE, SO PASSWORD-HASH COMPARISON FAILED WHEN DELETING
            // try{
            //     let threadToReport = await Thread.create({board: "chai_test_board", text: "Thread to be reported", delete_password: "delete"})
            //     thread_to_report_id = threadToReport._id
            //     console.log("Created THREAD to be REPORTED: _id:", thread_to_report_id)
            // } catch(err) {
            //     console.error("Error creating thread to be reported. err: ", err)
            //     return
            // }
            
        })
        // ==== CREATE A THREAD TO BE DELETED ====
        before( async () => {  //    ◘ ◘ ◘ RUN CHAIS WITHOUT THIS ◘ ◘ ◘ 
            try{
                let threadToDelete = await createThread("Thread to be deleted", "delete", "chai_test_board")
                thread_to_delete_id = threadToDelete._id
                console.log("Created THREAD to be DELETED. _id: ", thread_to_delete_id)
            } catch(err) {
                console.error("Error creating thread to be deleted. err: ", err)
                return
            }

            // ↓ ↓ ↓ ↓  THIS OPTION WAS MISSING THE PASSWORD HASH FEATURE, SO PASSWORD-HASH COMPARISON FAILED WHEN DELETING
            // Thread.create({board: "chai_test_board", text: "Thread to be deleted", delete_password: "delete"}, (err, threadToDelete) =>{
            //     if(err){console.error("Error creating thread to be deleted. err: ", err)  ;  return  }
            //     console.log("Created THREAD to be DELETED. _id: ", threadToDelete._id)
            //     thread_to_delete_id = threadToDelete._id
            //     done()
            // })

            

            // chai.request(server).keepOpen().post("/api/threads/chai_test_board")
            // .send({
            //     board: "chai_test_board", 
            //     text: "Thread to be deleted", 
            //     delete_password: "delete"
            // })
            // .end((err, res) => {
            //     if (err) { console.error(err); }
            //     thread_to_delete_id = res.body._id;
            //     done()
            // })
        })
        // ==== CREATE A THREAD TO REPLY TO ====
        before( async () => {  //    ◘ ◘ ◘ RUN CHAIS WITHOUT THIS ◘ ◘ ◘ 
            try{
                let threadToReplyTo = await createThread("Thread to reply to", "delete", "chai_test_board")
                thread_to_reply_to_id = threadToReplyTo._id
                console.log("Created THREAD to REPLY TO. _id: ", thread_to_reply_to_id)
            } catch(err) {
                console.error("Error creating thread to reply to. err: ", err)
                return
            }
        })
        // ==== CREATE A REPLY TO BE REPORTED ====
        before( async () => {
            try{
                let replyToReport = await createReply("chai_test_board", thread_to_report_id, "Reply to be reported", "delete")
                reply_to_report_id = replyToReport._id
                console.log("Created REPLY to be REPORTED. _id: ", reply_to_report_id)
            } catch(err){
                console.error("Error creating reply to be reported. err: ", err)
                return
            }
            // ↓ ↓ ↓ ↓  THIS OPTION WAS MISSING THE PASSWORD HASH FEATURE
            // try {
            //     let replyToReport = await Reply.create({board: "chai_test_board", thread_id: thread_to_report_id, text: "Reply to be reported", delete_password: "delete"})
            //     reply_to_report_id = replyToReport._id
            //     console.log("Created REPLY to be REPORTED. _id: ", reply_to_report_id)
            // } catch(err){
            //     console.error("Error creating reply to be reported. err: ", err)
            //     return
            // }
        })
        // ==== CREATE A REPLY TO BE DELETED ====
        before( async () => {
            try{
                let replyToDelete = await createReply("chai_test_board", thread_to_report_id, "Reply to be reported", "delete")
                reply_to_delete_id = replyToDelete._id
                console.log("Created REPLY to be DELETED. _id: ", reply_to_delete_id)
            } catch(err) {
                console.error("Error creating thread to be deleted. err: ", err)
                return
            }

            // ↓ ↓ ↓ ↓  THIS OPTION WAS MISSING THE PASSWORD HASH FEATURE, SO PASSWORD-HASH COMPARISON FAILED WHEN DELETING
            // try{
            //     let replyToDelete = await Reply.create({board: "chai_test_board", thread_id: thread_to_report_id, text: "Reply to be reported", delete_password: "delete"})
            //     reply_to_delete_id = replyToDelete._id
            //     console.log("Created REPLY to be DELETED. _id: ", reply_to_delete_id)
            // } catch(err){
            //     console.error("Error creating reply to be deleted. err: ", err)
            //     return
            // }
        })
        // ==== CHECK IF THERE ARE MORE THAN 12 THREADS IN THE DATABASE ====
        // ==== IF THERE'S LESS THAN 12 THREADS, CREATE MORE TO MAKE SURE THAT .get() RETURNS ONLY 10 THREADS ===
        let number_of_threads_in_db;
        before ( async () => {
            try{
                let thread_database = await Thread.find({board: "chai_test_board"}).sort({bumped_on: -1}).exec();
                number_of_threads_in_db = thread_database.length;
                console.log("Database length: ", number_of_threads_in_db)
            } catch(err){
                console.error(err); return (err)
            }
        
            let latest_thread;
            while( number_of_threads_in_db < 10 ){ // ◘ ◘ HAD TO SPLIT THE LOOP HERE AND FINISH IN THE NEXT before BLOCK, OR THE TESTS TIME OUT
                // i += 1;
                // console.log("Running loop")
                try{
                    latest_thread = await createThread(`Test thread #${ number_of_threads_in_db + 1 }`, "delete", "chai_test_board")
                    console.log("Created: Test thread #", number_of_threads_in_db+1)
                } catch(err) {
                    console.error("Error creating filler thread. err: ", err)
                    return
                }
                // if( number_of_threads_in_db == 10 ){
                //     thread_to_reply_to_id = latest_thread._id // GET _id OF 2ND-TO-LAST THREAD
                //     console.log("2) _id of THREAD to REPLY TO: ", thread_to_reply_to_id)
                //     console.log("2) Thread To Reply To: ", latest_thread)
                // }
                number_of_threads_in_db += 1
            }
            // for(let i = 0 ; i < 12 ; i++){ // ◘ ◘ THIS REQUIRES done TO BE ADDED TO THE FUNCTION SIGNATURE
            //     chai
            //     .request(server)
            //     .keepOpen()
            //     .post("/api/threads/chai_test_board")
            //     .send({
            //         board: "chai_test_board",
            //         text: `Test thread ${i}`,
            //         delete_password: "delete"
            //     })
            //     .end( (err, res) => {
            //         if(err){ console.error(err); return res.send(err)}
            //         // GET THE _id FOR THE NEWEST THREAD
            //         if( i == 11){
            //             chai_thread_id = res.body._id
            //         }
            //         console.log(`'Test thread ${i}' created` )
            //         done()
            //     })
            // }
        })
        before ( async () => {
            while( number_of_threads_in_db < 12 ){
                // i += 1;
                // console.log("Running loop")
                try{
                    latest_thread = await createThread(`Test thread #${ number_of_threads_in_db + 1 }`, "delete", "chai_test_board")
                    console.log("Created: Test thread #", number_of_threads_in_db+1)
                } catch(err) {
                    console.error("Error creating filler thread. err: ", err)
                    return
                }
               
                number_of_threads_in_db += 1
            }
        }) // ==== END OF ADDING THREADS

        // ==== ADD MORE THAN 3 REPLIES TO THE LATEST THREAD, TO MAKE SURE ONLY 3 ARE DISPLAYED ====
        before( async () => {
            let threadToReplyTo = await Thread.findById({_id: thread_to_reply_to_id})  
            // === CHECK HOW MANY REPLIES IT'S GOT ===
            let amount_of_replies  = threadToReplyTo.replies.length;
            let replyObj = {};
            while(amount_of_replies < 5){  // IF LESS THAN 5 REPLIES
                try{
                    let data = await Reply.create({board:"chai_test_board", thread_id: thread_to_reply_to_id, text:`Test Reply #${amount_of_replies + 1 }`, delete_password: "delete", created_on: new Date(Date.now())})
                    replyObj = {_id: data._id, text: data.text, created_on: data.created_on, delete_password: data.delete_password, reported: data.reported}
                    threadToReplyTo.replies.unshift(replyObj)
                    threadToReplyTo.bumped_on = replyObj.created_on;
                    console.log(`saved reply #${amount_of_replies + 1 } to the thread`)
                    console.log(`Created REPLY #${amount_of_replies + 1 }`)
                    amount_of_replies += 1
                } catch(err) {
                    console.error("Error creating filler reply. err: ", err)
                    return
                }
            }
            let new_thread_with_replies = await threadToReplyTo.save()
            console.log("New thread with five replies: ", new_thread_with_replies)
        })
        
        // ==== START TESTING — HOLD ON TO YOUR BUTTS ====
        test("1) Creating a new thread: POST request to /api/threads/{board}", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .post("/api/threads/chai_test_board")
            .send({
                board: "chai_test_board",
                text: "Test title for thread",
                delete_password: "delete key"
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                // response = {
                //     "replies": response.replies,
                //     "_id": response._id,
                //     "text": response.text,
                //     "board": response.board,
                //     "created_on": response.created_on,
                //     "bumped_on": response.bumped_on
                //   }
                chai_thread_id0 = res.body._id; // FOR FUTURE USE
                assert.equal(res.status, 200, "Status must be 200")
                assert.typeOf(res.body, "object", "'Type' should be 'object'")
                assert.equal(res.body.replies.length, 0, "'replies' should be an empty array")
                assert.isDefined(res.body._id, "_id should be defined")
                assert.equal(res.body.text, "Test title for thread", "text should be the same as the one sent")
                assert.equal(res.body.board, "chai_test_board", "board should be the same as the one sent")
                assert.isUndefined(res.body.delete_password, "Response should not include delete_password")
                assert.isUndefined(res.body.reported, "Response should not include 'reported'")
                assert.equal(res.body.created_on, res.body.bumped_on, "created_on and bumped_on should be the same")
                
                done()
            })
        })

        test("2) Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .get(`/api/threads/chai_test_board`)
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.isArray(res.body, "Response must be an array")
                assert.isAtMost(res.body.length, 10, "Response array cannot be longer than 10")
                assert.isTrue(res.body.every(thread => typeof thread.replies == 'object'), "Each object must have a 'replies' property of type 'object'") // CAN'T GET IT TO WORK
                assert.isTrue(res.body.every(thread => Array.isArray(thread.replies)), "Each object must have a 'replies' property that's an array")
                assert.isTrue(res.body.every(thread => thread.replies.length <= 3), "Each object's 'replies' array has three replies or less")
                assert.isTrue(res.body.every(thread => typeof thread._id == "string"), "Each object must have a '_id' property of type 'string'")
                assert.isTrue(res.body.every(thread => typeof thread.text == "string"), "Each object must have a 'text' property")
                assert.isTrue(res.body.every(thread => Date.parse(thread.created_on)), "Each object must have a 'created_on' property that corresponds to a valid date")
                assert.isNotNaN(res.body.every(thread => Date.parse(thread.bumped_on)), "Each object must have a 'bumped_on' property that corresponds to a valid date")
                done()
                // [  {
                //       "replies": [],
                //       "_id": "66c7521dae32c5637045943e",
                //       "text": "Test title for thread",
                //       "created_on": "Thu Aug 22 2024 11:58:37 GMT-0300 (hora estándar de Argentina)",
                //       "bumped_on": "Thu Aug 22 2024 11:58:37 GMT-0300 (hora estándar de Argentina)",
                //       "__v": 0
                //     },
                //     {
                //       "replies": [],
                //       "_id": "66c751e36f710734d0d4c486",
                //       "text": "Test title for thread",
                //       "created_on": "Thu Aug 22 2024 11:57:39 GMT-0300 (hora estándar de Argentina)",
                //       "bumped_on": "Thu Aug 22 2024 11:57:39 GMT-0300 (hora estándar de Argentina)",
                //       "__v": 0
                //     }  ]
            })
        })
        
        test("3) Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .delete("/api/threads/chai_test_board")
            .send({
                board: "chai_test_board",
                thread_id: thread_to_delete_id,
                delete_password: "wrong key"
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "incorrect password", "Response must be 'incorrect password'")
                done()
            })
        })
            
        test("4) Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .delete("/api/threads/chai_test_board")
            .send({
                board: "chai_test_board",  
                thread_id: thread_to_delete_id, 
                delete_password: "delete"
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "success", "Response should be 'success'")
                done()
            })
        })

        test("5) Reporting a thread: PUT request to /api/threads/{board}", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .put("/api/threads/chai_test_board")
            .send({
                board: "chai_test_board",
                thread_id: thread_to_report_id
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "reported", "Response should be 'reported'")
                // assert.equal(res.alert, "reported", "res.alert didn't work")
                // assert.equal(res.alert.body, "reported", "res.alert.body didn't work")
                done()
            })
        })

        test("6) Creating a new reply: POST request to /api/replies/{board}", (done)=>{
                chai
                .request(server)
                .keepOpen()
                .post("/api/replies/chai_test_board")
                .send({
                    board: "chai_test_board",
                    thread_id: thread_to_reply_to_id,
                    text: "Testing reply",
                    delete_password: "delete",
                })
                .end((err, res)=>{
                    if(err){console.error(err)}
                    assert.equal(res.status, 200, "Status must be 200")
                    // ◘ ◘ ◘ COMPLETE THIS ◘ ◘ ◘ 
                    done()
                })
        })

        test("7) Viewing a single thread with all replies: GET request to /api/replies/{board}", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .get(`/api/replies/chai_test_board?thread_id=${thread_to_reply_to_id}`)
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.isUndefined(res.body.delete_password, "'delete_password' should not be returned")
                assert.isUndefined(res.body.reported, "'reported' should not be returned")
                assert.isAbove(Date.parse(res.body.bumped_on), Date.parse(res.body.created_on), "bumped_on should be higher than created_on")
                // ANALYZING REPLIES ↓ ↓
                assert.isTrue(res.body.replies.every(reply => typeof reply.text == "string"), "Each reply must have a 'text' property of type 'string'")
                assert.isTrue(res.body.replies.every(reply => typeof reply._id == "string"), "Each reply must have a 'text' property of type 'string'")
                assert.isTrue(res.body.replies.every(reply => Date.parse(reply.created_on)), "Each reply must have a 'created_on' property that corresponds to a valid date")
                assert.isNotTrue(res.body.replies.some(reply => reply.delete_password), "no reply.delete_password should be returned")
                assert.isNotTrue(res.body.replies.some(reply => reply.reported), "no reply.reported should be returned")

                done()
            })
        })

        test("8) Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .delete("/api/replies/chai_test_board")
            .send({
                board: "chai_test_board",
                thread_id: thread_to_report_id, // ◘ ◘ SAFE TO USE THIS THREAD AS IT WON'T BE DELETED
                reply_id: reply_to_delete_id,
                delete_password: "wrong password"
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "incorrect password", "Failed delete operation should return 'incorrect password'")
                done()
            })
        })

        test("9) Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .delete("/api/replies/chai_test_board")
            .send({
                board: "chai_test_board",
                thread_id: thread_to_report_id, // ◘ ◘ SAFE TO USE THIS THREAD AS IT WON'T BE DELETED  
                reply_id: reply_to_delete_id, 
                delete_password: "delete"
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "success", "Successful delete operation should return 'success'")
                done()
            })
        })

        test("10) Reporting a reply: PUT request to /api/replies/{board}", (done)=>{
            chai
            .request(server)
            .keepOpen()
            .put("/api/replies/chai_test_board")
            .send({
                thread_id: thread_to_report_id,
                reply_id: reply_to_report_id
            })
            .end((err, res)=>{
                if(err){console.error(err)}
                assert.equal(res.status, 200, "Status must be 200")
                assert.equal(res.text, "reported", "Successful report operation should return 'reported'")
                // assert.equal(res.alert, "reported", "res.alert didn't work")
                // assert.equal(res.alert.body, "reported", "res.alert.body didn't work")
                // assert.equal(res.body, "reported", "Successful report operation should return 'reported'")
                done()
            })
        })

    })  // END OF CHAI TESTS
})
