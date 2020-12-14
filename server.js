const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const jwt = require('jsonwebtoken') ;

const JWT_SECRET = 'this is my secret' ;

const bcrypt = require('bcrypt');
const { Router } = require('express');
const saltRounds = 10; // 40 ~ hash P/s

app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static("public"));


// const AdminEmailId= sharamambeshcse@gmail.com;
// const AdminPasswords = 1234567890;

mongoose.connect("mongodb://localhost:27017/BookDB", {
    useUnifiedTopology: true, useNewUrlParser: true,
    useCreateIndex: true, useFindAndModify: false
})
    .then(() => {
        console.log(`Connection to DataBase established`);
    }).catch(err => {
        console.log(`db error ${err.message}`)
    })

const Schema = mongoose.Schema;
const Model = mongoose.model;

//admin 
const AdminSchema = new Schema({
    email: String,
    password: String
});
const Admin = Model("Admin", AdminSchema);


const userAuth = async(req, res, next) =>{
    console.log('This is a middleware function') ;
    const header = req.headers.authorization  ;
    //Bearer token => ['Bearer', 'token']
    console.log('header : ', header) ;
    try{
        if(!header){
            res.send("No authorization header found ") ;
        }
        const token = header.split(' ')[1] ;
        console.log(token) ;
        jwt.verify(token, JWT_SECRET, (err, user) => {
            console.log('user : ', user) ;
            if(err){
                return console.log('here is some error : ', err) 
            }
            
            next()
        }) ;
        // console.log(verify) ; 
        // if(!verify){
        //     res.send('No user with this token') ;
        // }
    
        // next() ;
    }catch(err){
        console.log('This is err in 500 : ', err) ;
    }
}

//Token format : Bearer token

app.get('/testing', userAuth, (req, res) => {
    console.log('This is testing api') ;
}) ;

app.post('/addAdmin', async(req, res) => {
    console.log('req.body : ', req.body) ;
    const {email, password} = req.body ;
    console.log('email and password is : ', email , "  ", password) ;
    // const AdminPass = 12345;
    const hash = await bcrypt.hash(password, 10) ;
    console.log('hash : ', hash) ;
    const AdminAccount = new Admin({
        email , 
        password : hash
    })
    await AdminAccount.save() ;
    console.log('New admin successfully created') ;
})

//user
const UserSchema = new Schema({
    email: String,
    password: String
});
const user = Model("user", UserSchema);

//book
const BookSchema = new Schema({
    title: String,
    content: String
});
const Book = Model("Book", BookSchema);




//Autherization Page

app.get("/", (req, res) => {
    res.render("Autherization");
});


//registeration user
app.get("/register", (reqq, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const newUser = new user({
            email: req.body.username,
            password: hash
        });
        newUser.save(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                res.render("secrets");
            }
        });
    });

});



//login User
app.get("/login", (req, res) => {
    res.render("login");
});

//user login check id password
app.post("/login", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const foundUser = await user.findOne({ email: username });
    if (!foundUser) {
        return console.log("User not found");
        
    }
    let isVerified = await bcrypt.compare(password, foundUser.password);
    if (!isVerified) {
        return console.log('Invalid credentials');
    }

    const token = await jwt.sign({id : foundUser._id}, JWT_SECRET) ;
    console.log('This is my login token : ', token) ;
    res.json({token})
    // res.redirect("/user");


    // user.findOne({ email: username }, function (err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (err) {
    //                     return console.log(err);
    //                 }

    //                 res.redirect("/userHome");

    //             });
    //         }
    //     }
    // });
});

//admin login
app.post("/adminlogin", async (req, res) => {

    let Adminemail = req.body.username;
    let AdminPassword = req.body.password;
    console.log('This is password :  ', AdminPassword);
    console.log('This is email : ', Adminemail);

    try {
        const foundAdmin = await Admin.findOne({ email: Adminemail });
        console.log('foundAdmin : ', foundAdmin) ;
        if (!foundAdmin) {
            prompt("You are not a admin");
            return console.log("Not a admin");
        };
        let isVerified = await bcrypt.compare(AdminPassword, foundAdmin.password);
        if (!isVerified) {
            return console.log("Invalid Password")
        }
        //
        res.redirect("/admin");
    }
    catch (err) {
        console.log(err);
    }

});
app.get("/adminlogin", (req, res) => {
    res.render("adminlogin")
})

                                                 
                                                         //admin APIS
//home page admin
app.get("/admin", function (req, res) {

       
    Book.find({}, function (err, result) {   //before any method of moongoose we use document variable
        let posts = result;
        res.render("admin", {
            posts: posts
        });

    });

});

//show books
app.get("/addBook", (req, res) => {
    console.log('Something isyy') ;
    res.render("postBook");

})
//Create book
app.post("/addBook/add", (req, res) => {

    var BookTitle = req.body.name;
    console.log(BookTitle);
    var Bookcontent = req.body.content;

    const bookAdd = new Book({
        title: BookTitle,
        content: Bookcontent
    });
    console.log(bookAdd);
    bookAdd.save()
    //res.sendDate(200).send("ok");
    res.redirect("/home");//not working?
});


//book details API Fetch by Id
app.get("/user/:BookId", async(req, res) => {
    var Id = req.params.BookId;
    console.log(Id);
  var bookId= await Book.findById(Id);
  console.log(bookId.title);
  res.render("userBook",{
      posts:bookId
    });



});

//users API                                                    

app.get("/user", (req, res)=>{
    
    Book.find({}, function(err, result){
        //console.log(result);
      let posts= result;
      res.render("user",{
          posts:posts
        });
    });
});                                              




//Book Apis
app.get("/userBook/:buy", (req, res)=>{
    let bookRentId = req.params.buy;
    console.log(bookRentId);


});


//about page
app.post('/aboutUS', (req, res) => {
    console.log(req.body.name);
    console.log(req.body.content);
    res.send("Successfully triggered");
});


app.listen(3000, () => {
    return console.log("server has started");
});






// app.post("/login", (req, res) => {

//     const username = req.body.username;
//     const password = req.body.password;

//     user.findOne({ email: username }, function (err, foundUser) {
//         if (err) {
//             console.log(err);
//         }
//         else {
//             if (foundUser) {
//                 bcrypt.compare(password, foundUser.password, function (err, result) {
//                     if (err) {
//                         return console.log(err);
//                     }

//                     res.redirect("/userHome");

//                 });
//             }
//         }
//     });
// // });

// app.get("/userHome", (req, res) => {
//     if (req.isAuthenticated()) {
//         res.render("userHome");
//     }
//     else {
//         res.redirect("/login");
//     }
// });



// app.get('/homeStd', (req, res) => {
//     res.send("Hello this is homeStd API");
//     // res.json({
//     //     name: "prasheet",
//     //     year: "3rd"
//     // })
// })
