require('dotenv').config()
// VAR

const cookieEncrypter = require('cookie-encrypter');
const cookieParser = require('cookie-parser');
const express = require('express');
const bodyParser = require("body-parser");
const firebase = require("firebase/app");
const auth = require("firebase/auth");
const database = require('firebase/database');
const nocache = require("nocache");
const cryptoJS = require("crypto-js");
const wildcardSubdomains = require('wildcard-subdomains');

const app = express();
const port = 5000;

//EJS

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");

//SUBDOMAINS

app.use(wildcardSubdomains({
  namespace: 's',
  whitelist: ['www', 'app'],
}))

app.get('/s/piter/', function(req, res){
  res.send('Hello')
})

//NO CACHE
app.use(nocache());

//BodyParser

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 

// Cookies

const cookieKey = process.env.COOKIE_KEY

const cookieParams = {
  httpOnly: true,
  signed: true,
  maxAge: 86400000,
};

app.use(cookieParser(cookieKey));
app.use(cookieEncrypter(cookieKey));

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

app.get('/', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.redirect("/home");

      }).catch(function (error) {
        res.render('index');
        console.log(error);
      });
    }
  } else { // User not logged in
    res.render('index');
  }
});

app.get('/login', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.redirect("/home");

      }).catch(function (error) {
        res.render('login', { error: error });
        console.log(error);
      });
    }
  } else { // User not logged in
    res.render('login', { error: null });
  }
});

app.post('/signin', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.redirect("/home");

      }).catch(function (error) {
        res.redirect("/login")
        console.log(error);
      });
    }
  } else { // User not logged in

    var email = req.body.email;
    var password = req.body.password;

    if (!validateEmail(email)) { //Error
      res.render('login', { error: 'The email is not valid' })
      return console.log('email err')
    }

    if (password == "") { //Error
      res.render('login', { error: 'There is no password' })
      return console.log('psw err')
    }

    var user = {
      email: email,
      password: password,

    }

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      res.cookie('session', user, cookieParams)
      console.log('Log in Success')
      res.redirect("/home");

    }).catch(function (error) {
      res.render('login', { error: error })
      console.log(error)
    });

  }

});

app.get('/register', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.redirect("/home");

      }).catch(function (error) {
        res.render('register', { error: error });
        console.log(error);
      });
    }
  } else { // User not logged in
    res.render('register', { error: null });
  }
});

app.post('/createUser', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.redirect("/home");

      }).catch(function (error) {
        res.render('register', { error: error });
        console.log(error);
      });
    }
  } else { // User not logged in

    var email = req.body.email;
    var password = req.body.password;

    if (!validateEmail(email)) { //Error
      res.send('Email Err')
      console.log('email err')
    }

    if (password == "") { //Error
      res.send('Password Err')
      console.log('psw err')
    }

    firebase.auth().createUserWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('User Created')

      var user = {
        email: email,
        password: password,
      }

      res.cookie('session', user, cookieParams)
      res.redirect("/home");

    }).catch(function (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          res.render('register', { error: `Email address ${email} already in use.` });
          console.log(`Email address ${email} already in use.`);
          break;
        case 'auth/invalid-email':
          res.render('register', { error: `Email address ${email} is invalid.` });
          console.log(`Email address ${email} is invalid.`);
          break;
        case 'auth/operation-not-allowed':
          res.render('register', { error: `Error during sign up.` });
          console.log(`Error during sign up.`);
          break;
        case 'auth/weak-password':
          res.render('register', { error: 'Password is not strong enough. Add additional characters including special characters and numbers.' });
          console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
          break;
        default:
          res.render('register', { error: error.message })
          console.log(error.message);
          break;
      }
    });

  }


});

app.get('/logout', (req, res) => { // Log out account

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')

      res.clearCookie('session');

      firebase.auth().signOut().then(() => {
        // Sign-out successful.
        res.redirect('/')
        console.log('SignOut Success')

      }).catch((error) => {
        // An error happened.
        res.redirect('/settings')
      });

    }).catch(function (error) {
      res.redirect('/')
      console.log(error)
    });

  } else {
    res.redirect('/')
  }
})

app.get('/home', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {
    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      var user = firebase.auth().currentUser;

      var notas = firebase.database().ref('notes/' + user.uid);
      notas.once('value', (snapshot) => {
        var notas = snapshot.val();

        var notasDecrypted = []

        for (nota in notas) {

          var noteTitleDecrypted = cryptoJS.AES.decrypt(notas[nota].NoteTitle, user.uid).toString(cryptoJS.enc.Utf8);
          var noteContentDecrypted = cryptoJS.AES.decrypt(notas[nota].NoteContent, user.uid).toString(cryptoJS.enc.Utf8);

          var noteDecrypted = {
            NoteTitle: noteTitleDecrypted,
            NoteContent: noteContentDecrypted,
            NoteDate: notas[nota].NoteDate,
          }

          notasDecrypted.push(noteDecrypted);
        }

        res.render('home', { usuario: email, notas: notasDecrypted });

        if (notas != null) { // There are notes
          console.log('Tienes Notas')
        } else if (notas == null) { // No notes found
          console.log('Todavia no tienes Notas')
        } else { // Error reading notes
          console.log('Error al leer Notas')
        }
      });
      console.log('Log in Success')

    }).catch(function (error) {
      res.redirect("/login");
      console.log(error)
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/deleteNote', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')

        var user = firebase.auth().currentUser;

        //Note fields

        var noteTitle = req.body.noteTitle;
        var noteContent = req.body.noteContent;



        //Notes DB

        var notas = firebase.database().ref('notes/' + user.uid);
        notas.once('value', (snapshot) => {
          var notas = snapshot.val();


          //Exist Notes

          if (notas != null) {

            for (nota in notas) {

            var noteTitleDecrypted = cryptoJS.AES.decrypt(notas[nota].NoteTitle, user.uid).toString(cryptoJS.enc.Utf8);
            var noteContentDecrypted = cryptoJS.AES.decrypt(notas[nota].NoteContent, user.uid).toString(cryptoJS.enc.Utf8);


              if (noteTitleDecrypted == noteTitle && noteContentDecrypted == noteContent && notas[nota].NoteDate) {
                reference.ref('notes/' + user.uid + '/' + nota).set({}) // Delete the fields inside de note
                  .then(function () {  // Remove note successful
                    res.redirect('/home');
                  })
                  .catch(function (error) {  // Remove note failed
                    console.log("Remove failed: " + error.message);
                  });

              } else {  // No notes with the fields set
                console.log('No se han encontrado Coincidencias entre las notas');
              }

            }

            // Don't exist notes

          } else if (notas == null) {
            console.log('Todabia no tienes notas');

            // Error reading notes

          } else {
            console.log('Error al leer Notas');
          }
        });

      }).catch(function (error) {
        res.redirect('/login');
        console.log(error);
      });
    }
  } else { // User not logged in
    res.redirect('/login');
  }

});

app.post('/newNote', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')

        var user = firebase.auth().currentUser;

        var noteTitle = req.body.noteTitle;
        var noteContent = req.body.noteContent;

        var today = new Date();
        var noteDate = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate() + '[' + today.getHours() + ':' + today.getMinutes() +']';

        // Check if there is content on the note

        if (noteTitle == "" || noteContent == "") return res.redirect('/home');

        noteTitle = cryptoJS.AES.encrypt(noteTitle, user.uid).toString();
        noteContent = cryptoJS.AES.encrypt(noteContent, user.uid).toString();

        // Creating note var

        var note = {
          name: noteTitle,
          content: noteContent,
          date: noteDate,
        }

        // New note into database

        reference.ref('notes/' + user.uid + '/' + reference.ref('notes/').push().key).set({
          NoteTitle: note.name,
          NoteContent: note.content,
          NoteDate: note.date
        }, (error) => {
          if (error) { // Note not saved
            console.log('No se ha guardado la nota: ' + error);
          } else {
            res.redirect('/home');
          }
        });


      }).catch(function (error) {
        res.redirect('/login');
        console.log(error);
      });
    }
  } else { // User not logged in
    res.redirect('/login');
  }
});

app.get('/settings', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')
      res.render('settings')

    }).catch(function (error) {
      res.render('changePassword', { error: error })
      console.log(error)
    });
  } else {
    res.redirect('/login')
  }
});

app.get('/changePassword', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (email != null | password != null) {
      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')
        res.render('changePassword', { usuario: email, error: null });

      }).catch(function (error) {
        res.redirect('/login')
        console.log(error);
      });
    }
  } else { // User not logged in
    res.redirect('/login')
  }

});

app.post('/changePassword', (req, res) => {

  var cookie = req.signedCookies.session;
  var password1 = req.body.password;
  var password2 = req.body.password2;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    if (password1 == password2) {

      firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
        //Successful
        console.log('Log in Success')

        user.updatePassword(password1).then(function () {
          console.log('Password updated')

          var user = {
            email: email,
            password: password
          }
  
          res.clearCookie('session');
          res.cookie('session', user, cookieParams)

          var email = req.signedCookies.session.email;
          var password = req.signedCookies.session.password;

          firebase.auth().signInWithEmailAndPassword(email, password1).then(function () {
            //Successful
            console.log('Log in Success')
            res.redirect('/home')

          }).catch(function (error) {
            res.render('changePassword', { error: error })
            console.log(error)
          });

        }).catch(function (error) {
          switch (error.code) {
            case 'auth/operation-not-allowed':
              res.render('changePassword', { error: `Error during sign up.` });
              console.log(`Error during sign up.`);
              break;
            case 'auth/weak-password':
              res.render('changePassword', { error: 'Password is not strong enough. Add additional characters including special characters and numbers.' });
              console.log('Password is not strong enough. Add additional characters including special characters and numbers.');
              break;
            default:
              res.render('changePassword', { error: error.message })
              console.log(error.message);
              break;
          }
        });

      }).catch(function (error) {
        res.redirect('/login');
      });

    } else {
      var error = "The passwords are not the same"
      res.render('changePassword', { error: error })
      console.log('The passwords are not the same')
    }

  }
});

app.get('/resetPassword', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')
      res.redirect('/changePassword')

    }).catch(function (error) {
      res.render('resetPassword')
      console.log(error)
    });

  } else {
    res.render('resetPassword')
  }

});

app.post('/resetPassword', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')
      res.redirect('/changePassword')

    }).catch(function (error) {

      var email = req.body.email;

      firebase.auth().sendPasswordResetEmail(email).then(function () {
        res.redirect('/login')
      }).catch(function (error) {
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

      console.log(error)
    });

  } else {

    var email = req.body.email;

    firebase.auth().sendPasswordResetEmail(email).then(function () {
      res.redirect('/login')
    }).catch(function (error) {
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

})

app.get('/changeEmail', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')
      res.render('changeEmail', { usuario: email, error: null })

    }).catch(function (error) {
      res.redirect('/login')
      console.log(error)
    });
  } else {
    res.redirect('/login')
  }
});

app.post('/changeEmail', (req, res) => {

  var cookie = req.signedCookies.session;

  if (cookie != null) {

    var email = req.signedCookies.session.email;
    var password = req.signedCookies.session.password;

    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
      //Successful
      console.log('Log in Success')
      var user = firebase.auth().currentUser;
      var email1 = req.body.email;
      var email2 = req.body.email2;

      if (email1 == email2) {
        
        if (email1 == user.email) {
          console.log('You are already using this email : ' + email1)
        } else {

          user.updateEmail(email1).then(function () {
            var user = {
              email: email,
              password: password
            }
    
            res.clearCookie('session');
            res.cookie('session', user, cookieParams)
  
            var email = req.signedCookies.session.email;
            var password = req.signedCookies.session.password;

            firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
              //Successful
              console.log('Log in Success')
              res.redirect('/home');
              console.log('Email Updated')
              res.redirect('/home')
        
            }).catch(function (error) {
              res.redirect('/login')
              console.log(error)
            });

          }).catch(function (error) {
            switch (error.code) {
              case 'auth/email-already-in-use':
                res.render('changeEmail', { error: `Email address ${email1} already in use.` });
                console.log(`Email address ${email1} already in use.`);
                break;
              case 'auth/invalid-email':
                res.render('changeEmail', { error: `Email address ${email1} is invalid.` });
                console.log(`Email address ${email1} is invalid.`);
                break;
              case 'auth/operation-not-allowed':
                res.render('changeEmail', { error: `Error during sign up.` });
                console.log(`Error during sign up.`);
                break;
              default:
                res.render('changeEmail', { error: error.message });
                console.log(error.message);
                break;
            }
          });
    
        }

      }

    }).catch(function (error) {
      res.redirect('/login')
      console.log(error)
    });
  } else {
    res.redirect('/login')
  }

});

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}