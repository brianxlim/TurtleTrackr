<template>
    <div class="main">
        <header>
            <!--Avatar container-->
            <div class="avatar-container">
                <img :src="turtleSrc" id="avatar" />
            </div>
            <!--Profile Info: includes name of user + editing profile button-->
            <div class="profile-info">
                <h2>{{ displayName }}</h2>
            </div>
        </header>
        <button id="edit-profile-button" @click="openEditProfile">Edit Profile</button>
        <!--Email and Password-->
        <div class="profile-details">
            <label>Email:</label>
            <input type="text" :value="email" disabled />
            
            <label>Password:</label>
            <div class="input-container">
                <input type="password" value="********" disabled />
                <span id="change-password-text" @click="goToChangePassword">Change Password</span>
            </div>
        </div>

        <div class="button-container">
            <button id="logout-button" @click="signOutUser">Logout</button>
            <button id="delete-account-button" @click="deleteAccount">Delete Account</button>
        </div>

        <!-- Avatar Modal -->
        <EditProfile
            v-if="showEditProfile"
            @close-modal="showEditProfile = false"
            @avatar-updated="handleAvatarUpdate"
        />
        
        <!-- Change Password Modal -->
        <ChangePasswordModal
            v-if="showChangePassword"
            @close="showChangePassword = false"
        />

    </div>
</template>


<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/AuthStores';
import EditProfile from '@/components/Profile/EditProfile.vue';
import ChangePasswordModal from '@/components/Profile/ChangePasswordModal.vue';


const authStore = useAuthStore();
const router = useRouter(); 
const displayName = ref(authStore.user?.displayName || "Guest");
const email = computed(() => authStore.user?.email || "");
const showChangePassword = ref(false);
const goToChangePassword = () => {
  showChangePassword.value = true;
};

const DEFAULT_AVATAR = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpwxCN33LtdMLbWdhafc4HxabqpaU0qVbDxQ&s";
const turtleSrc = ref(DEFAULT_AVATAR);

// Watch for changes in `authStore.user`
watch(() => authStore.user, (newUser) => {
    if (newUser && newUser.selectedTurtle && newUser.selectedTurtle.turtleFilename) {
        turtleSrc.value = `/turtles/${newUser.selectedTurtle.turtleFilename}`;
    } else {
        turtleSrc.value = DEFAULT_AVATAR;
    }
}, { immediate: true });

const showEditProfile = ref(false);
const openEditProfile = () => {
    showEditProfile.value = true;
};

const handleAvatarUpdate = (payload) => {
  const { turtle, name } = payload;

  if (turtle?.turtleFilename) {
    turtleSrc.value = `/turtles/${turtle.turtleFilename}`;
    authStore.user.selectedTurtle = turtle;
  }

  if (name) {
    displayName.value = name;
    authStore.user.displayName = name;
  }

  showEditProfile.value = false;
};


const signOutUser = async () => {
    await authStore.logUserOut(); 
};

import { getAuth, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";

import { getAuth, deleteUser } from "firebase/auth";
import {
  collection, getDocs, deleteDoc,
  doc, updateDoc, arrayRemove
} from "firebase/firestore";
import { db } from "@/firebase";

const deleteAccount = async () => {
  const confirmDelete = confirm("Are you sure you want to delete your account and all data?");
  if (!confirmDelete) return;

  const auth = getAuth();
  const user = auth.currentUser;
  const uid = user?.uid;

  if (!uid) {
    alert("No user found.");
    return;
  }

  try {
    // 1. Delete all subcollections
    const deleteSubcollection = async (subName) => {
      const subRef = collection(db, "Users", uid, subName);
      const snap = await getDocs(subRef);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }
      console.log(`Deleted subcollection ${subName}`);
    };

    await deleteSubcollection("Expenses");
    await deleteSubcollection("Goals");
    await deleteSubcollection("groups"); // if you have this

    // 2. Delete user document (after subcollections)
    await deleteDoc(doc(db, "Users", uid));
    console.log("Deleted main user document");

    // 3. Delete Auth user
    await deleteUser(user);
    console.log("Deleted Firebase Auth user");

    alert("Account fully deleted.");
    router.push("/");
  } catch (err) {
    console.error("Deletion failed:", err);
    if (err.code === "auth/requires-recent-login") {
      alert("Please log in again before deleting your account.");
    } else {
      alert("Failed to delete account: " + err.message);
    }
  }
};
</script>

<style scoped>
.main {
    padding: var(--padding-body);
}

header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.avatar-container {
    width: 10rem;
    height: 8rem;
    background-color: var(--color-accent-medium);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

#avatar {
    width: 8rem;
    height: 6rem;
    border-radius: 50%;
}

#edit-profile-button {
    color: black;
    background: none;
    border: none;
    font-size: 1rem;
    text-decoration: underline;
    cursor: pointer;
    display: block;
    margin-top: 0.5rem;
    text-align: center;
    padding-left: 1.8rem;
}

#edit-profile-button:hover {
    color: var(--color-accent-light);
}

.profile-info {
    display: flex;
    justify-content: left;
    align-items: center;
    background-color: var(--color-secondary-medium);
    width: 100%;
    height: 3rem;
    border-radius: 10px;
    font-weight: bold;
    font-size: 1.2rem;
    color: black;
    padding-left: 1.5rem;
}

.profile-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
}

.input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

input {
    border: 1px solid #ddd;
    background-color: lightgrey;
    border-radius: 10px;
    padding: 0.5rem;
    width: 100%;
    font-size: 1rem;
}

#change-password-text {
    position: absolute;
    right: 3px; /* Aligns text inside the input field */
    font-size: 0.8rem;
    color: black;
    text-decoration: underline;
    cursor: pointer;
    padding-right: 1rem;
}

#change-password-text:hover {
    color: var(--color-accent-light);
}

button {
    border-radius: 1rem;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    font-family: var(--font-body);
    font-size: 1rem;
    color: white;
}

button:hover {
    transition: ease-in-out 0.3s;
    cursor: pointer;
}

.button-container {
    display: flex;
    gap: 3rem;
}

#change-password-button {
    background-color: var(--color-secondary);
}

#logout-button {
    background-color: var(--color-accent-dark);
    color: black;
}

#logout-button:hover {
    background-color: var(--color-main-dark);
    color: white;
}

#delete-account-button {
    background-color: var(--color-accent-light);
    color: black;
}

#delete-account-button:hover {
    background-color: rgb(161, 57, 57);
    color: white;
}
</style>
