
/*Whenever you call res.render(), start looking inside /views.*/

const { check } = require("express-validator");
const { validationResult } = require("express-validator");
const User=require('../models/user')
const bcrypt=require('bcryptjs')

exports.getLogin=(req, res, next) => {
  res.render('auth/login', {pageTitle: 'Login',currentPage:'login',isLoggedIn:false,errors:[],oldInput:{email:''},user:{},userType:''});// user has not typed anything yet,so empty strings
}

exports.getSignup=(req, res, next) => {
  res.render('auth/signup', {pageTitle: 'SignUp',currentPage:'signup',isLoggedIn:false,errors:[],oldInput:{firstName:'',lastName:'',email:'',userType:''},user:{},userType:''});// user has not typed anything yet,so empty strings
}

exports.postSignup = [

  check("firstName")
    .trim()//removes extra spaces
    .isLength({ min: 2 })
    .withMessage("First Name must be at least 2 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First Name must contain only alphabets"),

  check("lastName")
    .matches(/^[A-Za-z]*$/)
    .withMessage("Last Name must contain only alphabets"),

  check("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(), //to convert email to standard format

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one digit")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character")
    .trim(),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("User Type must be selected")
    .isIn(["host", "guest"])//allowed values
    .withMessage("Invalid User Type"),

  check("terms")
    .notEmpty()
    .withMessage("Please Accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("Please Accept the terms and conditions");
      }
      return true;
    }),


  (req, res, next) => {
 const{firstName,lastName,email,password,userType}=req.body;//confirmPassword->You dont need after signup,Its only job is:To compare with password during validation.,terms->This is just a checkbox:Its only purpose:to ensure that user has accepted terms and conditions.
 const errors=validationResult(req);//this validationResult is coming from express-validator,you can name it anything but it should be same here and in the require statement above ,This collects all validation errors returned by Express Validator.
 if(!errors.isEmpty()){//if there are errors
   return res.status(422).render('auth/signup',{//422->Unprocessable Entity and render signup page again with errors
    pageTitle:'SignUp', 
    currentPage:'signup',
    isLoggedIn:false,
    errors:errors.array().map(err=>err.msg),//extracting only error messages from the errors object->const errors=validationResult(req);
    oldInput:{firstName,lastName,email,password,userType},//show the old values so that user dont need to enter again
    user:{},
   });
  }
 bcrypt.hash(password,12)//This happens ONLY after validation success.
  .then(hashedPassword=>{
  const user=new User({firstName,lastName,email,password:hashedPassword,userType})//if no errors ,create new user and save to database
   return user.save()//saving to database
  })
  .then(()=>{
  res.redirect("/login")//if errors.isEmpty(),there is no error,redirect to login page
  }).catch(err=>{//The .catch() you wrote is there to handle any errors that happen during the asynchronous operations — like hashing the password or saving the user to the database.
    console.log("Error While saving user",err)//
    return res.status(422).render('auth/signup',{//422->Unprocessable Entity and render signup page again with errors
    pageTitle:'SignUp', 
    currentPage:'signup',
    isLoggedIn:false,
    errors:[err.message],//extracting only error messages from the errors object->const errors=validationResult(req);
    oldInput:{firstName,lastName,email,password,userType},//show the old values so that user dont need to enter again
    user:{}
   })
  })
  // req.session.isLoggedIn=true;
  // res.cookie('isLoggedIn',true)
  // req.isLoggedIn=true;//
}]

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  // 1️⃣ Check if user exists
  const user = await User.findOne({ email: email });//User.findone comes from mongoose model which is connected to users collection in mongo db compass. so ia m checking whether email exists in users collection or not.
  if (!user) {
    return res.status(422).render('auth/login', {
      pageTitle: 'Login',
      currentPage: 'login',
      isLoggedIn: false,
      errors: ["User does not exist"],
      oldInput: { email }
    });
  }

  // 2️⃣ Compare the password entered with the hash in DB
  const isMatch = await bcrypt.compare(password, user.password);//user.password is coming from database and password is coming from req.body
  if (!isMatch) {
    return res.status(422).render('auth/login', {
      pageTitle: 'Login',
      currentPage: 'login',
      isLoggedIn: false,
      errors: ["Invalid Password"],
      oldInput: { email },
      user:{},
    });
  }

  // 3️⃣ If password matches, create a session and redirect
  req.session.isLoggedIn = true;  // Set isLoggedIn to true in session
  req.session.userId = user._id.toString();  // Store only userId as string to avoid BSON serialization issues
  req.session.userType = user.userType;  // Store userType as string to display correct navbar items (guest or host)
  // Removed: req.session.user = user; - storing entire user object causes BSON version conflicts
  // res.cookie('isLoggedIn', true)
  // req.isLoggedIn = true;
  console.log("Session saved (after login):", req.session)
  // CRITICAL: Save session to MongoDB before redirecting so isLoggedIn persists across requests
  req.session.save((err) => {
    if (err) {
      // If session save fails, render error page
      console.log("Error saving session:", err);
      return res.status(422).render('auth/login', {
        pageTitle: 'Login',
        currentPage: 'login',
        isLoggedIn: req.isLoggedIn,  // Pass session isLoggedIn value
        errors: ["Error during login. Please try again."],
        oldInput: { email },
        user:{}
      });
    }
    // Session saved successfully to MongoDB, now redirect to home page where navbar will appear
    res.redirect("/");
  });
};

exports.postLogout=(req, res, next) => {
   req.session.destroy(()=>{
    res.redirect("/login")
   })
}
/**exports.postLogin=(req, res, next) => {
  console.log(req.body)
  req.isLoggedIn=true;You are manually adding a property called isLoggedIn to the request object.
  res.redirect("/")
}  here when i logged in also it is not showing navbars,bcoz that custom variable it is only true for that postLogin route,req.isLoggedIn = true ,but after that redirect happens so req.isloggedin is gone or false ,new req goes to browser */ 



/**  // res.cookie('isLoggedIn',true)
 * res.cookie(...) = server sends a response telling the browser to save the cookie.

Browser saves it.

On every next request, the browser sends request + cookie back to the server.

Server reads the cookie and already knows which user it is */




//    req.session.isLoggedIn=true;
/*🍔 ZOMATO LOGIN FLOW (Step-by-step)
1️⃣ User submits login form

Browser → Server:

POST /login
phone=999999
otp=1234


Express receives this as req.

2️⃣ Server checks and logs in the user

You write:

req.session.isLoggedIn = true;
req.session.userId = 123;


This means:

➡️ Zomato saves login data in the SERVER session. ex -isloogedin=true,userId=123
➡️ NOT in the browser.

3️⃣ Session gets a unique ID

Express-session creates something like:

sessionId = "abc123xyz"


And stores:

sessionStore["abc123xyz"] = {
   isLoggedIn: true,
   userId: 123
}

4️⃣ Server sends back a COOKIE with the sessionId

Server → Browser (response header):

Set-Cookie: connect.sid=abc123xyz


Browser saves this session ID cookie.

Not the login data.

5️⃣ Browser redirects to homepage

You do:

res.redirect("/")

6️⃣ Browser sends the cookie automatically on every request

Browser → Server:

GET /home
Cookie: connect.sid=abc123xyz

7️⃣ Server looks up the session

Server finds:

sessionStore["abc123xyz"] → { isLoggedIn: true, userId: 123 }


Now Zomato knows:

✔ User is logged in
✔ Which user it is
✔ What to show

🎯 SUPER SIMPLE FINAL SUMMARY
Browser stores:
connect.sid = abc123xyz

Server stores:
isLoggedIn = true
userId = 123

Server uses the cookie to find the session.*/





/*✅ What req.session.destroy() does
1. Deletes the session data on the SERVER

Example removed from server:

{ isLoggedIn: true, userId: 123 }

**2. The browser still has the old cookie ID,

but it no longer points to any session.**

So next request:

connect.sid = abc123


Server checks → finds nothing → user is logged out.

🎯 Brief Summary

It deletes the session on the server,
so the cookie in the browser becomes useless.
can check in mongo compass also*/