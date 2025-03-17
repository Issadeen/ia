import { collection, addDoc, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";

export async function testFirestorePermissions() {
  try {
    // Try to write a test document
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const testDoc = {
      userId: user.uid,
      test: true,
      timestamp: new Date().toISOString()
    };
    
    // Try to add document
    const docRef = await addDoc(collection(db, 'test_permissions'), testDoc);
    console.log("Test document written with ID: ", docRef.id);
    
    // Try to read documents
    const querySnapshot = await getDocs(collection(db, 'documents'));
    console.log("Successfully read documents collection");
    
    return { 
      success: true, 
      message: `Auth: ${user.uid}, Write: Success, Read: ${querySnapshot.size} documents` 
    };
  } catch (error) {
    console.error("Firestore permission test failed:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
