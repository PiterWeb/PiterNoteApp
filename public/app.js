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


// Port

app.listen(process.env.PORT || 3000 , () => {
    console.log(`App listening http://localhost:${port}`);
  })

// Routes

app.get('/', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) { // User log in
    res.redirect('/home')
  }else{ // User not logged in
    res.render('index');
  }
});

app.get('/login', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) { // User log in
      res.redirect('/home');
  } else { // User not logged in
      res.render('login', {error:null});
  }
});

app.get('/register', (req,res) => {
  var user = firebase.auth().currentUser;
  if (user) { // User log in
      res.redirect('/home');
  } else { // User not logged in
      res.render('register', {error:null});
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

              if (notas != null){ // There are notes
                console.log('Tienes Notas')
              }else if (notas == null){ // No notes found
                console.log('Todavia no tienes Notas')
              }else{ // Error reading notes
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
              res.redirect('/')

            }).catch((error) => {
              // An error happened.
              console.error(error);
            });

        } else {
            // No user is signed in.
            res.redirect('/login')
        }
})

app.get('/changePassword', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){ // User log in
    res.render('changePassword', {usuario:user ,error: null })
}else{ // User not logged in
  res.render('/login')
}
});

app.get('/resetPassword', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){ // User log in
    res.redirect('/home')
  }else{ // User not logged in
    res.render('resetPassword')
  }
});

app.get('/changeEmail', (req,res) =>{
  var user = firebase.auth().currentUser;

  if (user){  // User log in
  res.render('changeEmail', {usuario:user ,error: null })
  }else{ // User not logged in
    res.redirect('/login')
  }
});


app.post('/deleteNote', (req, res) => {
  
  var user = firebase.auth().currentUser;

  if (user){  //User log in

    //Note fields

    var noteTitle = req.body.noteTitle;
    var noteContent = req.body.noteContent;

    //Notes DB

    var notas = firebase.database().ref('notes/' + user.uid);
    notas.once('value', (snapshot) => {
      var notas = snapshot.val();
      

      //Exist Notes

      if (notas != null){

        for (nota in notas){
          if (notas[nota].NoteTittle == noteTitle || notas[nota].NoteContent == noteContent ) {
            console.log(notas) 
            reference.ref('notes/' + user.uid +'/' + nota).set({ }) // Delete the fields inside de note
            .then(function() {  // Remove note successful
              res.redirect('/home');
            })
            .catch(function(error) {  // Remove note failed
              console.log("Remove failed: " + error.message);
            });

          }else{  // No notes with the fields set
            console.log('No se han encontrado Coincidencias entre las notas');
          }

        }

      // Don't exist notes

      }else if (notas == null){
      console.log('Todabia no tienes notas');

      // Error reading notes

      }else{
      console.log('Error al leer Notas');
      }
      });
      }else{  // User not logged in
        res.redirect('/login');
      }
});

app.post('/newNote', (req,res) =>{

  var user = firebase.auth().currentUser;

  if (user){  // User log in

  // Note fields

  var noteTitle = req.body.noteTitle;
  var noteContent = req.body.noteContent;
  var today = new Date();
  var noteDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

  // Creating note var

  var note = {
    name: noteTitle,
    content: noteContent,
    date: noteDate,
  }

  // New note into database

  reference.ref('notes/' + user.uid +'/'+ reference.ref('notes/').push().key ).set({
    NoteTitle: note.name,
    NoteContent: note.content,
    NoteDate: note.date
  }, (error) => {
    if (error){ // Note not saved
      console.log('No se ha guardado la nota: '+ error);
    }else{
      res.redirect('/home');
    }
  });
  }else{  // User not logged in
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
        res.render('changePassword', {error:error})
        console.log(error)
    });

  }).catch(function(error) {
    switch (error.code) {
    case 'auth/operation-not-allowed':
            res.render('changePassword', {error: `Error during sign up.` });
            console.log(`Error during sign up.`);
            break;
          case 'auth/weak-password':
            res.render('changePassword', {error: 'Password is not strong enough. Add additional characters including special characters and numbers.' });
            console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
            break;
          default:
            res.render('changePassword', {error: error.message })
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
            res.render('register', {error: `Email address ${email} already in use.` });
            console.log(`Email address ${email} already in use.`);
            break;
          case 'auth/invalid-email':
            res.render('register', {error: `Email address ${email} is invalid.` });
            console.log(`Email address ${email} is invalid.`);
            break;
            case 'auth/operation-not-allowed':
              res.render('register', {error: `Error during sign up.` });
              console.log(`Error during sign up.`);
              break;
            case 'auth/weak-password':
              res.render('register', {error: 'Password is not strong enough. Add additional characters including special characters and numbers.' });
              console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
              break;
            default:
              res.render('register', {error: error.message })
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
      res.render('login', {error: 'The email is not valid'})
      console.log('email err')
    }

    if(password == "") { //Error
      res.render('login', {error: 'There is no password'})
      console.log('psw err')
    }

    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
        //Successful
        console.log('Log in Success')
        res.redirect("/");

    }).catch(function(error) {
        res.render('login', {error: error})
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
          res.render('changeEmail', {error: `Email address ${email} already in use.` });
          console.log(`Email address ${email} already in use.`);
          break;
        case 'auth/invalid-email':
          res.render('changeEmail', {error: `Email address ${email} is invalid.` });
          console.log(`Email address ${email} is invalid.`);
          break;
        case 'auth/operation-not-allowed':
          res.render('changeEmail', {error: `Error during sign up.` });
          console.log(`Error during sign up.`);
          break;
        default:
          res.render('changeEmail', {error: error.message });
          console.log(error.message);
          break;
        }
    });

  }
}else {
  res.redirect('/')
}

});

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}