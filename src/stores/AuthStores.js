import { defineStore } from "pinia";
import { ref } from "vue";
import { onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import router from "@/router/router";

export const useAuthStore = defineStore("authStore", () => {
    const user = ref(null);

      // Listen to auth state changes and merge custom data from Firestore
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Merge custom data; note: Firebase only supports certain fields natively.
            firebaseUser.displayName = userData.displayName || firebaseUser.displayName;
            firebaseUser.selectedTurtle = userData.selectedTurtle;
        }
        }
        user.value = firebaseUser;
    });

    // Register a user with email and password, update displayName in both Auth and Firestore
    const registerUserWithEmailPassword = async (email, password, displayName, selectedTurtle) => {
        try {
            // Update the Firebase Auth user profile to include displayName
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
        
        // Create a new document in the "users" collection with the user's UID
        await setDoc(doc(db, "users", userCredential.user.uid), { displayName, selectedTurtle });

        } catch (error) {
            console.error("Registration error:", error);
            alert("Unable to create user now. Try again later. " + error.message);
            return error;
        }
    };

    // Sign in user with email and password
    const logInWithEmailAndPassword = async (email, password) => {
        try {
            // Store user in Pinia store
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user.value = userCredential.user;

            // Fetch additional custom fields from Firestore
            const userDocRef = doc(db, "users", user.value.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Update the user object with custom data from Firestore
                user.value.displayName = userData.displayName;
                user.value.selectedTurtle = userData.selectedTurtle;
            }
        } catch (error) {
            // Check the Firebase error code to display a custom message
            if (error.code === "auth/invalid-credential") {
                alert("Invalid email address/password. Please try again.")
            }
            console.error("Log in error:", error);
            return error;
        }
    };

    // Log the user out
    const logUserOut = async () => {
        try {
            await signOut(auth);
            user.value = null;
            router.push("/auth");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // TODO: Update user avatar
    const updateUserAvatar = async (avatarURL) => {

    };

    return {
        user,
        registerUserWithEmailPassword,
        logInWithEmailAndPassword,
        logUserOut,
        updateUserAvatar,
    };
});
