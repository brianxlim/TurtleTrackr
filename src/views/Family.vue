<template>
    <div class="family-container">
      <!-- Header with Buttons -->
      <div class="header">
        <h1>My Families</h1>
        <div class="buttons">
          <button @click="showCreateGroupModal = true" class="btn create-btn">Create Group</button>
          <button @click="showJoinGroupModal = true" class="btn join-btn">Join Group</button>
        </div>
      </div>
  
      <!-- Groups Display -->
      <div v-if="groups.length > 0" class="group-list">
        <div v-for="group in groups" :key="group.id" class="group-card" @click="goToGroupDetails(group.id)">
          <div class="group-header" :style="{ backgroundColor: group.color }">
            <h2>{{ group.name }}</h2>
          </div>
          <div class="group-body">
            <img :src="group.image || '/images/default.png'" alt="Group Image" class="group-image" />
            <p class="group-members">{{ group.members.length }} Members</p>
            <p class="group-total">Total: ${{ group.totalSpent.toFixed(2) }}</p>
            <p class="group-code">Invite Code: <span>{{ group.groupCode }}</span></p>
          </div>
        </div>
      </div>
  
      <!-- Show Empty State If No Groups Exist -->
      <div v-else class="empty-state">
        <p>You are not part of any groups yet.</p>
      </div>
  
      <!-- Create Group Modal -->
      <div v-if="showCreateGroupModal" class="modal">
        <div class="modal-content">
          <span class="close" @click="showCreateGroupModal = false">&times;</span>
          <h2>Create Group</h2>
          <input v-model="newGroupName" placeholder="Enter group name" class="input-field" />
          <button @click="createGroup" class="btn submit-btn" :disabled="loading">
            {{ loading ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>
  
      <!-- Join Group Modal -->
      <div v-if="showJoinGroupModal" class="modal">
        <div class="modal-content">
          <span class="close" @click="showJoinGroupModal = false">&times;</span>
          <h2>Join Group</h2>
          <input v-model="joinGroupCode" placeholder="Enter group invite code" class="input-field" />
          <button @click="joinGroup" class="btn submit-btn" :disabled="loading">
            {{ loading ? "Joining..." : "Join" }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import { db, auth } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  arrayUnion,
  onSnapshot
} from "firebase/firestore";
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    const goToGroupDetails = (groupId) => {
      router.push({ name: "FamilyDetails", params: { id: groupId } });
    };

    return { goToGroupDetails };
  },

  data() {
    return {
      showCreateGroupModal: false,
      showJoinGroupModal: false,
      newGroupName: "",
      joinGroupCode: "",
      groups: [],
      loading: false,
      unsubscribe: null
    };
  },

  mounted() {
    this.listenToUserGroups();
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  },

  methods: {
    generateGroupCode() {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    },

    async createGroup() {
      if (!this.newGroupName.trim()) {
        alert("Please enter a group name");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to create a group.");
        return;
      }

      this.loading = true;
      const groupCode = this.generateGroupCode();

      const newGroup = {
        name: this.newGroupName,
        image: "/images/default.png",
        members: [user.uid],
        totalSpent: 0,
        inviteCode: groupCode,
        color: "#C0C0C0",
        createdBy: user.uid,
        createdAt: new Date()
      };

      try {
        // 1. Add to global `groups/` collection
        const groupDocRef = await addDoc(collection(db, "groups"), newGroup);
        const groupId = groupDocRef.id;

        // 2. Add to this user's `Users/{uid}/groups/{groupId}` subcollection
        await setDoc(doc(db, "Users", user.uid, "groups", groupId), {
          name: newGroup.name,
          inviteCode: newGroup.inviteCode,
          joinedAt: new Date()
        });

        alert(`Group created successfully! Invite Code: ${groupCode}`);
      } catch (err) {
        console.error("Error creating group:", err);
        alert("Error creating group. Please try again.");
      }

      this.newGroupName = "";
      this.showCreateGroupModal = false;
      this.loading = false;
    },

    async joinGroup() {
      if (!this.joinGroupCode.trim()) {
        alert("Please enter a group invite code.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to join a group.");
        return;
      }

      this.loading = true;

      try {
        const groupQuery = query(
          collection(db, "groups"),
          where("inviteCode", "==", this.joinGroupCode.trim().toUpperCase())
        );
        const groupSnapshot = await getDocs(groupQuery);

        if (groupSnapshot.empty) {
          alert("Invalid invite code. Please try again.");
          this.loading = false;
          return;
        }

        const groupDoc = groupSnapshot.docs[0];
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();

        // Check if user already has this group in their subcollection
        const userGroupRef = doc(db, "Users", user.uid, "groups", groupId);
        const userGroupDoc = await getDoc(userGroupRef);
        if (userGroupDoc.exists()) {
          alert("You are already a member of this group.");
          this.loading = false;
          return;
        }

        // Add user to top-level group
        await updateDoc(groupDoc.ref, {
          members: arrayUnion(user.uid)
        });

        // Add to user's subcollection
        await setDoc(userGroupRef, {
          name: groupData.name,
          inviteCode: groupData.inviteCode,
          joinedAt: new Date()
        });

        alert("You have successfully joined the group!");
      } catch (err) {
        console.error("Error joining group:", err);
        alert("Error joining group. Please try again.");
      }

      this.joinGroupCode = "";
      this.showJoinGroupModal = false;
      this.loading = false;
    },

    listenToUserGroups() {
      const user = auth.currentUser;
      if (!user) return;

      const userGroupsRef = collection(db, "Users", user.uid, "groups");
      this.unsubscribe = onSnapshot(userGroupsRef, async (snapshot) => {
        const updatedGroups = [];

        for (const docSnap of snapshot.docs) {
          const groupId = docSnap.id;
          const groupDoc = await getDoc(doc(db, "groups", groupId));
          if (groupDoc.exists()) {
            updatedGroups.push({
              id: groupId,
              ...groupDoc.data()
            });
          }
        }

        this.groups = updatedGroups;
      });
    }
  }
};
</script>

  
  <style scoped>
  .family-container {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
    background: #fdf6e3;
    padding: 20px;
    border-radius: 10px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .buttons {
    display: flex;
    gap: 10px;
  }
  
  .btn {
    padding: 10px 15px;
    border: none;
    font-size: 16px;
    cursor: pointer;
    border-radius: 5px;
  }
  
  .create-btn {
    background-color: #627EA4;
    color: white;
  }
  
  .join-btn {
    background-color: #A9C4EA;
    color: white;
  }
  
  .group-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  
  .group-card {
    width: 250px;
    background: white;
    border-radius: 10px;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    padding: 15px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }
  
  .group-header {
    font-size: 18px;
    font-weight: bold;
    padding: 10px;
    border-bottom: 2px solid #ccc;
  }
  
  .group-body {
    padding: 15px;
  }
  
  .group-image {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 10px;
  }
  
  .group-code {
    font-size: 14px;
    color: #555;
  }
  </style>
  