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
        <div v-for="group in groups" :key="group.id" class="group-card">
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
  import { collection, addDoc, getDocs, query, where, updateDoc, arrayUnion } from "firebase/firestore";
  
  export default {
    data() {
      return {
        showCreateGroupModal: false,
        showJoinGroupModal: false,
        newGroupName: "",
        joinGroupCode: "",
        groups: [],
        loading: false
      };
    },
    async mounted() {
      await this.fetchGroups();
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
          groupCode,
          color: "#C0C0C0",
          createdBy: user.uid,
          createdAt: new Date()
        };
  
        try {
          const docRef = await addDoc(collection(db, "groups"), newGroup);
          this.groups.push({ id: docRef.id, ...newGroup });
  
          this.showCreateGroupModal = false;
          this.newGroupName = "";
          alert(`Group created successfully! Invite Code: ${groupCode}`);
        } catch (error) {
          console.error("Error creating group:", error);
          alert("Error creating group. Please try again.");
        }
  
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
        const groupsRef = collection(db, "groups");
        const querySnapshot = await getDocs(query(groupsRef, where("groupCode", "==", this.joinGroupCode)));
  
        if (querySnapshot.empty) {
          alert("Invalid group code. Please try again.");
          this.loading = false;
          return;
        }
  
        querySnapshot.forEach(async (doc) => {
          const groupRef = doc.ref;
          const groupData = doc.data();
  
          if (!groupData.members.includes(user.uid)) {
            await updateDoc(groupRef, {
              members: arrayUnion(user.uid)
            });
            alert("You have successfully joined the group!");
            this.fetchGroups();
          } else {
            alert("You are already in this group.");
          }
        });
  
        this.showJoinGroupModal = false;
        this.joinGroupCode = "";
        this.loading = false;
      },
      async fetchGroups() {
        try {
          const querySnapshot = await getDocs(collection(db, "groups"));
          this.groups = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.error("Error fetching groups:", error);
        }
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
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    padding: 15px;
    text-align: center;
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
  