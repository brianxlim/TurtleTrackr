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
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-card"
        @click="goToGroupDetails(group.id)"
        :style="{ borderColor: (group.color || '#ccc') + '88' }"
      >
        <div
          class="group-header"
          :style="{
            backgroundColor: group.color || '#e0e0e0',
            color: getTextColor(group.color || '#e0e0e0')
          }"
        >
          <h2>{{ group.name }}</h2>
        </div>
        <div class="group-body">
          <img :src="group.image || '/images/default.png'" alt="Group Image" class="group-image" />
          <p class="group-members">{{ group.members.length }} Members</p>
          <p class="group-total">Total: ${{ group.totalSpent.toFixed(2) }}</p>
          <p class="group-code">Invite Code: <span>{{ group.inviteCode }}</span></p>
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
        <div class="mascot-wrap">
          <img src="/images/turtle_wave.gif" class="turtle-mascot" />
          <div class="speech-bubble">Hi pookie! Ready to create a fam?</div>
        </div>
        <h2>Create Group</h2>
        <input v-model="newGroupName" placeholder="Enter group name" class="input-field" />

        <label style="margin-top: 15px;">Choose Group Color:</label>
        <div class="color-swatch-container">
          <div
            v-for="color in presetColors"
            :key="color"
            class="color-swatch"
            :style="{
              backgroundColor: color,
              border: selectedColor === color ? '3px solid #444' : '2px solid transparent'
            }"
            @click="selectedColor = color"
          ></div>
        </div>

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
import confetti from 'canvas-confetti';

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
      selectedColor: "#C0C0C0",
      presetColors: [
        "#F7B267", "#F4845F", "#8AC6D1", "#A1C298",
        "#D5AAFF", "#FFA5AB", "#FFCB77", "#B5EAEA",
        "#B084CC", "#C0C0C0"
      ],
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

    getTextColor(bgColor) {
      if (!bgColor) return "#000";
      const hex = bgColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 160 ? "#000" : "#fff";
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
        color: this.selectedColor || "#C0C0C0",
        createdBy: user.uid,
        createdAt: new Date()
      };

      try {
        const groupDocRef = await addDoc(collection(db, "groups"), newGroup);
        const groupId = groupDocRef.id;

        await setDoc(doc(db, "Users", user.uid, "groups", groupId), {
          name: newGroup.name,
          inviteCode: newGroup.inviteCode,
          joinedAt: new Date()
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error("Error creating group:", err);
        alert("Error creating group. Please try again.");
      }

      this.newGroupName = "";
      this.selectedColor = "#C0C0C0";
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

        const userGroupRef = doc(db, "Users", user.uid, "groups", groupId);
        const userGroupDoc = await getDoc(userGroupRef);
        if (userGroupDoc.exists()) {
          alert("You are already a member of this group.");
          this.loading = false;
          return;
        }

        await updateDoc(groupDoc.ref, {
          members: arrayUnion(user.uid)
        });

        await setDoc(userGroupRef, {
          name: groupData.name,
          inviteCode: groupData.inviteCode,
          joinedAt: new Date()
        });

        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.7 },
        });
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
.turtle-mascot {
  width: 100px;
  max-height: 120px;
  object-fit: contain;
  margin-bottom: 0px;
  animation: floatWave 2s ease-in-out infinite;
}

.mascot-wrap {
  flex-direction: column;
  align-items: center;
}

.speech-bubble {
  background: #fff;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  position: center;
  top: 5px;
  left: 100px;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background-color: #fffaf0;
  border-radius: 20px;
  padding: 30px 25px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: slideIn 0.4s ease-out;
}

.modal-content h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.close {
  position: absolute;
  top: 12px;
  right: 18px;
  font-size: 28px;
  cursor: pointer;
  color: #aaa;
}

.close:hover {
  color: #333;
}

.submit-btn {
  background-color: #627ea4;
  color: white;
  font-weight: bold;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.submit-btn:disabled {
  background-color: #999;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}


.family-container {
  max-width: 1100px;
  margin: 0 auto;
  background: #fefae0;
  padding: 40px 20px;
  border-radius: 16px;
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #3e533f;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  color: white;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.create-btn {
  background-color: #627ea4;
  color: white;
}

.join-btn {
  background-color: #a9c4ea;
  color: white;
}

.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
}

.group-card {
  width: 250px;
  border-radius: 12px;
  background: #ffffff;
  border: 4px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  cursor: pointer;
}

.group-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.group-header {
  padding: 16px;
  font-size: 20px;
  font-weight: 700;
}

.group-body {
  padding: 20px;
  text-align: center;
}

.group-image {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 12px;
  border: 2px solid #ccc;
}

.group-members,
.group-total,
.group-code {
  margin: 5px 0;
  font-size: 14px;
  color: #444;
}

.empty-state {
  font-size: 18px;
  color: #888;
  margin-top: 50px;
}

.color-swatch-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
  gap: 10px;
}

.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}
</style>
