import * as firebase from 'firebase/app';
import { deepUpdate as _deepUpdate } from './deep-update';


// ==============================================================
//    Firestore type Augmentation  (type definition only)
// ==============================================================
declare module 'firebase/app' {
    export namespace firestore {
        export interface CollectionReference {
            xBindData: (data: any) => firebase.Unsubscribe;
        }
        export interface Query {
            xBindData: (data: any) => firebase.Unsubscribe;
        }
    }
}



// ==============================================================
//    Firestore prototype augmentation  (implementation)
// ==============================================================

function xBindData<T>(this: firebase.firestore.CollectionReference | firebase.firestore.Query, data: Array<{id: string, data: T}>, onError?: (error: Error)=>void, options: firebase.firestore.SnapshotListenOptions = {}) {
    const off = this.onSnapshot(options, (snapshot: firebase.firestore.QuerySnapshot) => {
        snapshot.docChanges().forEach( (docChange: firebase.firestore.DocumentChange) => {
            if (docChange.type === 'added') {
                let doc = {id: docChange.doc.id, data: docChange.doc.data() as T}; // Add more typings to remove `as` statement
                data.splice(docChange.newIndex, 0, doc);
            }
            else if (docChange.type === 'modified') {
                let newDoc = {id: docChange.doc.id, data: docChange.doc.data() as T}; // Add more typings to remove `as` statement
                if (docChange.oldIndex === docChange.newIndex) {
                    // _deepUpdate(data[docChange.oldIndex], newDoc) // ANGULAR do NOT need deepUpdate when using trackBy
                    data[docChange.oldIndex] = newDoc;
                }
                else {
                    data.splice(docChange.oldIndex, 1); // remove from previous position
                    data.splice(docChange.newIndex, 0, newDoc); // add to new position
                }
            }
            else if (docChange.type === 'removed') {
                data.splice(docChange.oldIndex, 1);
            }
        });
    }, onError);
    return off;
}

firebase.firestore.CollectionReference.prototype.xBindData = xBindData;
firebase.firestore.Query.prototype.xBindData = xBindData;

// ==============================================================
//    Stronger typings for firestore
// ==============================================================
// TODO add this to module augmentation section? nooo :)
export interface ColRef<T> extends firebase.firestore.CollectionReference {
    xBindData: (data: Array<{id: string, data: T}>) => firebase.Unsubscribe;
}

export interface Query<T> extends firebase.firestore.Query {
    xBindData: (data: Array<{id: string, data: T}>) => firebase.Unsubscribe;
}



// TODO add:
// - DocRef<T> + docRef.xBindData
// - get with id
// - set with/without id
// - update with/without id
// - docSnap.xBindData (instead of DocRef on snapshot) - other xBindData implementation should be used
// add onSnapshot options and errorHandlers