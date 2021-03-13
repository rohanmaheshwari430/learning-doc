import admin from 'firebase-admin';
import express from 'express';


const serviceAccount = require("./dtilearningdocserviceaccount.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dtilearningdocsp2021-default-rtdb.firebaseio.com/"
})

const app = express();
app.use(express.json());

const db = admin.firestore();

type Student = {
    "name": string,
    "netid": string,
    "grad_year": number
}

const students = db.collection('students');

app.get("./getStudents", async (req, res) => {
    const allStudents = await students.get();
    const localStudents : Student[] = [];

    for(const doc of allStudents.docs) {
        let student: Student = doc.data() as Student;
        localStudents.push(student);
    }

    res.send({"success": true, "data": localStudents})
})

app.post('/createStudent', (req,res) => {
    const student: Student = req.body;
    if(student.name == null || student.netid == null || student.grad_year == null) {
        res.send({"message": "one or more fields is missing", "success": false})
    }
    else {
        const newStudent = students.doc(student.name);
        newStudent.set(student);
        res.send({"success": true, "data": newStudent})
    }
})

app.delete('/deleteStudent', async (req, res) => {
    
    admin.auth()
    .verifyIdToken(req.headers.idtoken as string)
    .then(async() => {
        const student_name = req.body.name;
        if((await students.doc(student_name).get()).exists) {
            students.doc(student_name).delete();
            res.send({"success": true, "data": student_name})
        }
    })
    .catch(() => {
        res.send({"message": "Not Authenticated", "success": false})
    })
})


app.post('/updateStudent', async (req, res) => { 
    admin.auth()
    .verifyIdToken(req.headers.idtoken as string)
    .then(async() => {
        const student_name = req.body.name;
        const netID = req.body.netid;
        const gradYear = req.body.grad_year;
        if(student_name == null) {
            res.send({"message": "missing student name", "success":false})
        }
        else if(netID == null) {
            students.doc(student_name).update({"grad_year": gradYear})
            res.send({"success": true, "message": "updated grad year"});
        }
        else if(gradYear == null) {
            students.doc(student_name).update({"netid": netID})
            res.send({"success": true, "message": "updated netid"});
        }
        else {
            students.doc(student_name).update({"netid": netID, "grad_year": gradYear})
            res.send({"success": true, "message": "updated grad year and"});
        }
       
    })
    .catch(() => {
        res.send('Not Authenticated');
    });
   

    
});


