//Require Express
var express = require('express');
var app = express();

//Require the handlebars express package
//Require mongoose
//Require bcrypt
//Require Passport
var handlebars = require('express-handlebars');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrpyt = require('bcryptjs');
passport = require('passport');
const session = require('express-session');

const port = process.env.PORT || 3000; // if we're running locally then pass in port 3000
const mongoURL = process.env.mongoURL ||  'mongodb://localhost:27017/handlebars';

require('./middleware/passport')(passport);
const { isAuth } = require('./middleware/isAuth');

const Contact = require('./models/Contact');
const User = require('./models/User');

app.use(express.static('public'));
app.use(express.static('assets'));
app.use(
    session({//using express-session
    secret: 'mySecret', // used to create a token similar to bcrpyt- gives individual access to the session
    resave: true,
    saveUnitialized: true,
    cookie: { maxAge: 60000 }
    })
);

app.use(passport.initialize());
app.use(passport.session()); //session handles it post login
// body parser structures the request into JSON format that's simple to use
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false}))

//use app.set to tell express to use handlebars as our view engine
app.set('view engine', 'hbs');
//Pass some additional information to handlebars to that is can find our layouts folder, and allow
//us to use the .hbs extension for our files.
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    extname: 'hbs'
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/home', isAuth, (req, res) => {
    try {
        var users;
        var contacts;
    Contact.find({ user: req.user.id }).lean()
        .exec((err, contacts) => {
            if (contacts.length) {
                res.render('home', { layout: 'main', contacts: contacts, contactsExist: true, username: req.user.username });
            } else {
                res.render('home', { layout: 'main', contacts: contacts, contactsExist: false,});
            }
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
});

app.get('/signout', (req, res)=>{
    req.logout();
    res.redirect('/')
})

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    try { 
        // await waits on the request to make sure it has everything loaded
        let user = await User.findOne({ username });
        
        if (user) {
            // res.redirect('/');
            return res.status(400).render('login', { layout: 'main', userExist: true });
            // return console.log('User Already Exists');
        }
        user = new User({
            username,
            password
        });
          // salt process generates a random string which attaches it to the encrypted string
          const salt = await bcrpyt.genSalt(10);
          // password encryption using password and salt
          user.password = await bcrpyt.hash(password, salt);

          await user.save();
          res.status(200).render('login', { layout: 'main', userDoesNotExist: true });
          // user.save(); 
          // res.redirect('/create');
      } catch (err) {
          console.log(err.message);
      // gives a code to our error on the web side
          res.status(500).send('Server Error')
      }
  })

app.post('/signin', (req, res, next) => {
    try {
        passport.authenticate('local', {
            successRedirect: '/home',
            failureRedirect: '/?incorrectLogin' // fix this?
        })(req, res, next);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})

app.post('/addContact', (req, res) => {
    //users are destructured to extract the name, email and number from the req
    const { name, email, number } = req.body;
    try { 
    let contact = new Contact({
        user: req.user.id, 
        name,
        email,
        number
    });
    
    contact.save();
    res.redirect('/home?contactSaved');//dont work
} catch (err) {
    console.log(err.message);
// gives a code to our error on the web side
    res.status(500).send('Server Error')
}
})

app.get('/', (req, res) => {
    res.render('login', {layout: 'main'});
})

app.get('/login' , (req, res) => {
    res.render('login', {layout: 'main'});
})

app.get('/create', (req, res) => {
    res.render('create', {layout: 'main'});
})

app.get('/contact', (req, res) => {
    res.render('contact', {layout: 'main'});
})

// mongoose.connect('mongodb://localhost:27017/handlebars'
mongoose.connect(mongoURL, {  // connect to the local database at top
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(() => {
        console.log('connected to DB')
    })
    .catch((err) => {
        console.log('Not Connected to DB : ' + err);
    });

//Listening for requests on port 3000
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});