'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');

// const apiRoutes         = require('./routes/api.js'); ◘ ◘ THIS NEEDED TO BE CHANGE IN ORDER FOR api.js TO EXPORT threadSchema AND Thread
const { apiRoutes }         = require('./routes/api.js'); // < < THIS IS THE CHANGE ◘ ◘ 
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const helmet = require('helmet') // ◘ MY CODE ◘
const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// ↓ ↓ ↓ ↓ ↓ SECURITY FEATURES ↓ ↓ ↓ ↓ ↓ 
app.use(helmet({
  noCache: {},
  contentSecurityPolicy:{
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'unsafe-inline'"], //LIFESAVER
      scriptSrc: ["'self'", "localhost", "'unsafe-inline'", "code.jquery.com", "https://code.jquery.com/jquery-2.2.1.min.js"], //LIFESAVER
      // scriptSrc: ["'self'"],
      // styleSrc: ["'self'"], // Allow styles from the same origin and trusted.com
      imgSrc: ["'self'"], // Allow images from the same origin and trusted.com
      connectSrc: ["'self'"], // Allow AJAX, WebSocket, etc. connections to the same origin
      fontSrc: ["'self'"]
    }
  },
  referrerPolicy: {
    policy: "same-origin"
  }
}))

// ↑ ↑ ↑ ↑ ↑ SECURITY FEATURES ↑ ↑ ↑ ↑ ↑ 

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
