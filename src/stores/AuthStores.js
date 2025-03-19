import { defineStore } from "pinia";
import { ref } from "vue";
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    signInWithPopup,
    GoogleAuthProvider,
    updatePassword,
    deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/firebase";
import router from "@/router/router";

export const useAuthStore = defineStore("authStore", () => {
    const user = ref(null);

      // Listen to auth state changes and merge custom data from Firestore
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "Users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            firebaseUser.displayName = userData.displayName;
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
        
        // Create a new document in the "Users" collection with the user's UID
        await setDoc(doc(db, "Users", userCredential.user.uid), { displayName, selectedTurtle });

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
            const userDocRef = doc(db, "Users", user.value.uid);
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

    // Delete user account
    const deleteUserAccount = async () => {
        if (auth.currentUser) {
            try {
                // TODO: Delete all of user's details in Firestore as well, such as his membership in groups, expenses, etc
                await deleteUser(auth.currentUser);
                return true;
            } catch (error) {
                throw error;
            }
        }

        return false;
    }

    // TODO: Update user avatar
    const updateUserAvatar = async (avatarURL) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found");

            // Update profile in Firebase Auth
            await updateProfile(currentUser, { photoURL: avatarURL });

            // Update Firestore database
            const userDocRef = doc(db, "Users", currentUser.uid);
            await updateDoc(userDocRef, { photoURL: avatarURL });

            // Update local user state
            user.value.photoURL = avatarURL;
        } catch (error) {
            console.error("Error updating avatar:", error);
        }
    };

    const updateUserPassword = async (currentPassword, newPassword) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticated user found");

            // Re-authenticate user before updating password
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password in Firebase Auth
            await updatePassword(currentUser, newPassword);
            alert("Password updated successfully!");
        } catch (error) {
            console.error("Error updating password:", error);
            return error;
        }
    };

    // Google sign in
    const logInWithGoogle = async () => {
        signInWithPopup(auth, googleProvider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result); // returns a Google Access Token
            const token = credential.accessToken;
            const user = result.user; // signed-in user info
        }) .catch((error) => {
            // TODO: Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error); // AuthCredential type that was used
        });
    }

    return {
        user,
        registerUserWithEmailPassword,
        logInWithEmailAndPassword,
        logUserOut,
        updateUserAvatar,
        deleteUserAccount,
    };
});
