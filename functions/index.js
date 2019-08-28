const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
var storage = require('@google-cloud/storage');
var excel = require('excel4node');
const path = require('path');
const os = require('os');
const fs = require('fs');
const csv = require('to-csv');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//storage
admin.initializeApp({
    //credential: admin.credential.cert(serviceAccount),
  
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://bitsdelivery-6a7e4.firebaseio.com/",
    storageBucket: "gs://bitsdelivery-6a7e4.appspot.com"
  });

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'unresolved.shubham@gmail.com',
        pass: 'vvkosjzfmbfodadu'
    }
});

var workbook = new excel.Workbook();

// Add Worksheets to the workbook
var worksheet = workbook.addWorksheet('Sheet 1');

// Create a reusable style
var style = workbook.createStyle({
  font: {
    color: '#FFFFFF',
    size: 14
  }//,
  //numberFormat: '$#,##0.00; ($#,##0.00); -'
});


exports.getStudentList = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        
        const dest = req.query.dest;
       // const dest = 'f20170712@goa.bits-pilani.ac.in'
        const bucket = admin.storage().bucket();
       // const spaceRef = bucket.file(`\/Bill\/${ResName}\.pdf`);

        var d = new Date();
        const day = d.getDate();
        const month = d.getMonth()+1;
        const year = d.getFullYear();

        const para = `${month}_${year}`

       // console.log('updated value is',`Something : dd=${day},mm=${month},yyyy=${year}`);

        const databaseRef = admin.database().ref(`Users`);

        var i=0; //for excell sheet

        databaseRef.once('value').then(function(snapshot)
        {

          var data = []; //array of students

          snapshot.forEach(function(dataSnapshot)
          {
              dataSnapshot.child('SkipMess').child(para).forEach(function(_snapshot)
              {
                    var _day = _snapshot.child('day').val();
                   // console.log("Check : ",`day = ${_day}`);
                    if(day == _day)
                    {
                        var id = dataSnapshot.child('Id').val();
                        var name = dataSnapshot.child('Name').val();
                        var email = dataSnapshot.child('Email').val();
                        //console.log("Check : ",`user = ${id}`)

                        data.push({ 
                            Name: `${name}`,
                            ID: `${id}`,
                            Email: `${email}`

                            //value: data.length % 2 
                        });
                        i = i+1;
                    }
              });
 
          });

        if(i>0)
        {

          const attachment =[
            { // use URL as an attachment
            //filename: 'invoice.png',
            //content: file,
            // content: fs.createReadStream(pdf)
              contentType: 'text/plain',


            // use URL as an attachment
                filename: 'StudentList.csv',
                //path: pdf
                content: csv(data)
              }
            ];

            const mailOptions = {
                from: 'SchwiftyCold <unresolved.shubham@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
                to: dest,
                subject: `Students List for Mess Skip on ${day}-${month}-${year}`, // email subject
                html: `
                <html>
                <head><title>Students List</title></head>
                <body>
                <p>This mail contains the list of students who want to skip mess on ${day}-${month}-${year}</p>
                <p></p>
                </body>
                </html>`
                    , // email content in HTML
                
                attachments: attachment
                
            };

            // returning result
            return transporter.sendMail(mailOptions, (erro, info) => {
                
                console.log('Mail Check : ',dest);
                
                if(erro){
                    return res.send(erro.toString());
                }
                return res.send('Sent');
            });

        }
        else
        {
            console.log('No Students Found ',`${i}`);
            return res.send('Today is empty');
        }

       /* return res.send(`
        <html>
        <head><title>Sent</title></head>
        <body>
        <p>The list of students has been emailed for
        ${day}-${month}-${year}</p>        
        </body>
        </html>`);*/

    });    
    });
});
