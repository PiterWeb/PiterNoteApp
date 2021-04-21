require('dotenv').config()
// VAR

const express = require('express');
const bodyParser = require("body-parser");
const firebase = require("firebase/app");
const auth = require("firebase/auth");
const database = require('firebase/database');

const app = express();
const port = 5000;

//EJS

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");

//BodyParser

app.use(bodyParser.urlencoded({ extended: false })); 

// Firebase

const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTH_DOMAIN ,
  databaseURL: process.env.DB_URL ,
  projectId: process.env.PROJECT_ID ,
  storageBucket: process.env.STORAGE_BUCKET ,
  messagingSenderId: process.env.MESSAGING_SENDER_ID ,
  appId: process.env.APP_ID
};

firebase.initializeApp(firebaseConfig);
const reference = firebase.database();

function createNote(note) {
  var user = firebase.auth().currentUser;

  reference.ref('notes/' + user.uid +'/'+ firebase.database().ref('notes/').push().key ).set({
      NoteTitle: note.name,
      NoteContent: note.content,
      NoteDate: note.date
  });
}

// Port

app.listen(port, () => {
    console.log(`App listening http://localhost:${port}`);
  })

// Routes

app.get('/', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    res.redirect('/home')
  }else{
    res.render('index');
  }
});

app.get('/login', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) {
      res.redirect('/home');
  } else {
      res.render('login');
  }
});

app.get('/register', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) {
      res.redirect('/home');
  } else {
      res.render('register');
  }
});

app.get('/home' , (req,res) =>{
  var user = firebase.auth().currentUser;
        if (user) {
            // User is signed in.
              var notas = firebase.database().ref('notes/' + user.uid);
              notas.once('value', (snapshot) => {
              var notas = snapshot.val();
              
              res.render('home', {usuario: user.email, notas:notas});

              if (notas != null){
                console.log('Tienes Notas')
              }else if (notas == null){
                console.log('Todavia no tienes Notas')
              }else{
                console.log('Error al leer Notas')
              }
              });

        } else {
            // No user is signed in.
            res.redirect('/login')
        }
});

app.get('/settings', (req,res) =>{
  var user = firebase.auth().currentUser;
        if (user) {
            // User is signed in.
            res.render('settings', {usuario: user.email})
        } else {
            // No user is signed in.
            res.redirect('/login')
        }
})

app.get('/logout',(req,res) =>{ // Log out account
  var user = firebase.auth().currentUser;
        if (user) {
            // User is signed in.
            firebase.auth().signOut().then(() => {
              // Sign-out successful.
            }).catch((error) => {
              // An error happened.
            console.error(error);
            });
            
            res.redirect('/')

        } else {
            // No user is signed in.
            res.redirect('/login')
        }
})

app.get('/changePassword', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){
    res.render('changePassword', {error: null })
}else{
  res.render('/login')
}
});

app.get('/changeEmail', (req,res) =>{
  var user = firebase.auth().currentUser;

  if (user){
  res.render('changeEmail')
  }else{
    res.redirect('/login')
  }
});


app.post('/deleteNote', (req, res) => {
  
  var user = firebase.auth().currentUser;

  if (user){

    var noteTitle = req.body.noteTitle;
    var noteContent = req.body.noteContent;

    var notas = firebase.database().ref('notes/' + user.uid);
    notas.once('value', (snapshot) => {
      var notas = snapshot.val();
      
      if (notas != null){

        for (nota in notas){
          if (notas[nota].NoteTittle == noteTitle || notas[nota].NoteContent == noteContent ) {
            console.log(notas) 
            reference.ref('notes/' + user.uid +'/' + nota).set({ })
            .then(function() {
              res.redirect('/home');
            })
            .catch(function(error) {
              console.log("Remove failed: " + error.message);
            });

          }else{
            console.log('No se han encontrado Coincidencias entre las notas');
          }

        }

      }else if (notas == null){
      console.log('Todabia no tienes notas');

      }else{
      console.log('Error al leer Notas');
      }
      });
      }else{
        res.redirect('/login');
      }
});

app.post('/newNote', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){
  var noteTitle = req.body.noteTitle;
  var noteContent = req.body.noteContent;
  var today = new Date();
  var noteDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

  var note = {
    name: noteTitle,
    content: noteContent,
    date: noteDate,
  }

  reference.ref('notes/' + user.uid +'/'+ reference.ref('notes/').push().key ).set({
    NoteTitle: note.name,
    NoteContent: note.content,
    NoteDate: note.date
  }, (error) => {
    if (error){
      console.log('No se ha guardado la nota: '+error);
    }else{
      res.redirect('/home');
    }
  });
  }else{
    res.redirect('/login');
  }
  });

app.post('/changePassword', (req,res) =>{

  var user = firebase.auth().currentUser;
  var password = req.body.password;
  var password2 = req.body.password2;
  var email = user.email;

  if(password == password2){


  user.updatePassword(password).then(function() {
    console.log('Password updated')

    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
      //Successful
      console.log('Log in Success')
      res.redirect("/home");

    }).catch(function(error) {
        console.log(error)
    });

  }).catch(function(error) {
    switch (error.code) {
    case 'auth/operation-not-allowed':
            console.log(`Error during sign up.`);
            break;
          case 'auth/weak-password':
            console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
            break;
          default:
            console.log(error.message);
            break;
    } 
  });

  }else{
    var error = "The passwords are not the same"
    res.render('changePassword', {error: error })
    console.log('The passwords are not the same')
  }

})

app.post('/createUser', (req,res) =>{

      var email = req.body.email;
      var password = req.body.password;

        if(!validateEmail(email)) { //Error
          res.send('Email Err')
          console.log('email err')
        }
      
        if(password == "") { //Error
          res.send('Password Err')
          console.log('psw err')
        }

        firebase.auth().createUserWithEmailAndPassword(email, password).then(function() {
          //Successful
          console.log('User Created')
          res.redirect("/");
          var user = firebase.auth().currentUser;
          user.sendEmailVerification().then(function() {}).catch(function(error) {});
      }).catch(function(error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            console.log(`Email address ${email} already in use.`);
            break;
          case 'auth/invalid-email':
            console.log(`Email address ${email} is invalid.`);
            break;
          case 'auth/operation-not-allowed':
            console.log(`Error during sign up.`);
            break;
          case 'auth/weak-password':
            console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
            break;
          default:
            console.log(error.message);
            break;
        }
      });

});
      
app.post('/signin', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){
    res.redirect('/');
  }else{
    
    var email = req.body.email;
    var password = req.body.password;

    if(!validateEmail(email)) { //Error
      res.send('Email Err')
      console.log('email err')
    }

    if(password == "") { //Error
      res.send('Password Err')
      console.log('psw err')
    }

    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
        //Successful
        console.log('Log in Success')
        res.redirect("/");

    }).catch(function(error) {
        console.log(error)
    });

  }

});

app.post('/resetPassword', (req,res) =>{
  var email = req.body.email;

    firebase.auth().sendPasswordResetEmail(email).then(function() {
      res.redirect('/login')
    }).catch(function(error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          console.log(`Email address ${email} already in use.`);
          break;
        case 'auth/invalid-email':
          console.log(`Email address ${email} is invalid.`);
          break;
        case 'auth/operation-not-allowed':
          console.log(`Error during sign up.`);
          break;
        default:
          console.log(error.message);
          break;
        }
    });

})

app.post('/changeEmail', (req,res) =>{

  var user = firebase.auth().currentUser;
  var email = req.body.email;

  if (user){

  if (email == user.email){
    console.log('You are already using this email : '+email )
  }else{

    user.updateEmail(email).then(function() {
      res.redirect('/home');
      console.log('Email Updated')
    }).catch(function(error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          console.log(`Email address ${email} already in use.`);
          break;
        case 'auth/invalid-email':
          console.log(`Email address ${email} is invalid.`);
          break;
        case 'auth/operation-not-allowed':
          console.log(`Error during sign up.`);
          break;
        default:
          console.log(error.message);
          break;
        }
    });

  }
}else {
  res.redirect('/')
}

});

// app.get('/api',(req,res) => {
//   res.json({
//     mensaje: "NodeJs and JWT"
//   });
// });

// app.get('/api/login',(req,res) => {
//   const user = {
//     id : 1 ,
//     name : "Piter" ,
//     password : "PiterPasw",
//   }

//   jwt.sign({user: user}, process.env.ACCESS_TOKEN_SECRET, (err, token) => {
//     res.json({
//       token: token
//     })
//   })

// });

// app.post('/api/post', verifyToken,(req,res) => {

//   jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err , authdata) => {
//     if(err){
//       res.sendStatus(403);
//     }else{
//       res.json({
//         mensaje:'Post fue creado',
//         authdata: authdata
//       });
//     }
//   });

// });

// // Functions

// function verifyToken (req, res , next){
//   // Autorization: Bearer <token>
//   const bearerHeader = req.headers['authorization'];

//   if (typeof bearerHeader !== 'undefined'){
//       const bearerToken = bearerHeader.split(" ")[1];
//       req.token = bearerToken;
//       next()
//   }else {
//     res.sendStatus(403);
//   }
  
// }

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}