<template>
  <div v-if="group" class="family-details">
    <button class="back-btn" @click="router.back()">← Back</button>
    <h1>{{ group.name }}</h1>
    <div class="group-info">
      <p><strong>Invite Code:</strong> {{ group.inviteCode }}</p>
      <p>
        <strong>Total Spent:</strong>
        ${{ group.totalSpent ? group.totalSpent.toFixed(2) : '0.00' }}
      </p>
    </div>

    <FamilyDetailMembers :members="group.members" />
    <button class="leave-btn" @click="confirmLeaveGroup">Leave Group</button>
  </div>

  <div v-else class="loading">
    <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
    <p>Loading group details...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, auth } from '@/firebase';
import { doc, getDoc, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import FamilyDetailMembers from '@/components/Family/FamilyDetailMembers.vue';

const route = useRoute();
const router = useRouter();
const groupId = route.params.id;
const group = ref(null);

const fetchGroupDetails = async () => {
  try {
    const groupRef = doc(db, "Groups", groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      group.value = groupSnap.data();
    } else {
      console.error("Group not found.");
    }
  } catch (err) {
    console.error("Error fetching group:", err);
  }
};

const confirmLeaveGroup = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to leave this group? You will no longer have access to group insights."
  );
  if (!confirmed) return;

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in.");
    return;
  }

  const groupRef = doc(db, "Groups", groupId);
  const userGroupRef = doc(db, "Users", user.uid, "Groups", groupId);

  try {
    // Remove the user from the group's members array
    await updateDoc(groupRef, { members: arrayRemove(user.uid) });
    // Delete the group from the user's subcollection
    await deleteDoc(userGroupRef);

    // Check if the group is now empty, and if so, delete the group
    const updatedGroupSnap = await getDoc(groupRef);
    if (updatedGroupSnap.exists()) {
      const updatedGroup = updatedGroupSnap.data();
      if (!updatedGroup.members || updatedGroup.members.length === 0) {
        await deleteDoc(groupRef);
        console.log("Group deleted because it had no more members.");
      }
    }

    alert("You have left the group.");
    router.push("/family");
  } catch (err) {
    console.error("Error leaving group:", err);
    alert("Failed to leave group.");
  }
};

onMounted(fetchGroupDetails);
</script>

<style scoped>
.family-details {
  max-width: 40rem;
  width: 80%;
  margin: 2rem auto;
  padding: 3rem;
  background: #fff;
  border-radius: 2rem;
  box-shadow: 0 0.25rem 0.625rem rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: var(--color-accent-dark);
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background-color: #2e6dff;
  transition: ease-in-out 0.2s;
}

.leave-btn {
  background-color: var(--color-accent-light);
  color: black;
  padding: 0.5rem 1rem;
  margin-top: 1.25rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.leave-btn:hover {
  background-color: #e57373;
  color: white;
  transition: ease-in-out 0.2s;
}

.group-info p {
  font-size: 1.125rem;
  margin: 0.4rem 0;
}

.loading {
  text-align: center;
  font-size: 1.25rem;
  color: gray;
  margin-top: 1.25rem;
}
</style>
