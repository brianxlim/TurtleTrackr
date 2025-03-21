import { defineStore } from "pinia";
import { ref } from "vue";
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    signInWithPopup,
    updatePassword,
    deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/firebase";
import router from "@/router/router";

const FIRESTORE_USERS_DB_REF = "Users"

export const useAuthStore = defineStore("authStore", () => {
    const user = ref(null);
    const showAvatarModal = ref(false);

      // Listen to auth state changes and merge custom data from Firestore
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, FIRESTORE_USERS_DB_REF, firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                firebaseUser.displayName = userData.displayName;

                if (!userData.selectedTurtle) {
                    showAvatarModal.value = true;
                } else {
                    firebaseUser.selectedTurtle = userData.selectedTurtle;
                    showAvatarModal.value = false;
                }
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
        
        // Create new Firestore entry
        await setDoc(doc(db, FIRESTORE_USERS_DB_REF, userCredential.user.uid), { displayName, selectedTurtle });

        } catch (error) {
            console.error("Registration error:", error);
            alert("Unable to create user now. Try again later. " + error.message);
            return error;
        }
    };

    // Log in user with email and password
    const logInWithEmailAndPassword = async (email, password) => {
        try {
            // Store user in Pinia store
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user.value = userCredential.user;

            // Fetch additional custom fields from Firestore
            const userDocRef = doc(db, FIRESTORE_USERS_DB_REF, user.value.uid);
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

    // Google log in
    const logInWithGoogle = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            user.value = userCredential.user; // signed-in user info
    
            // Create new Firestore entry
            await setDoc(doc(db, FIRESTORE_USERS_DB_REF, userCredential.user.uid), { displayName: userCredential.user.displayName });
            router.push("/home");
            return true;
        } catch (error) {
            throw error;
        }
    }

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
    // TODO: Delete all of user's details in Firestore as well, such as his membership in groups, expenses, etc
    const deleteUserAccount = async () => {
        if (auth.currentUser) {
            try {
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
            const userDocRef = doc(db, FIRESTORE_USERS_DB_REF, currentUser.uid);
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

    return {
        user,
        showAvatarModal,
        registerUserWithEmailPassword,
        logInWithEmailAndPassword,
        logInWithGoogle,
        logUserOut,
        updateUserAvatar,
        deleteUserAccount,
    };
});
