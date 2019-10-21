import { DocRef, doNotOptimizeMe } from '../src/firestore-extra';
import * as firebase from 'firebase';

test('example', () => {
    firebase.initializeApp({
        apiKey: 'AIzaSyCaV4DDYJMgW7uqRP-JMZIcQWRNB3RdD1c',
        authDomain: 'washly-apptimia-poc.firebaseapp.com',
        databaseURL: 'https://washly-apptimia-poc.firebaseio.com',
        projectId: 'washly-apptimia-poc',
        storageBucket: '',
        messagingSenderId: '333993473058',
        appId: '1:333993473058:web:a9c3e4c310a65cf3cc467b',
        measurementId: 'G-QWXVB0S9DB'
      });
    let fs = firebase.firestore();
    doNotOptimizeMe();
    console.log(fs.collection('x').xGet);
    // EMPTY for now
    // Use at your own risk
});