<template>
  <div v-if="group" class="family-details">
    <button class="back-btn" @click="$router.back()">← Back</button>

    <h1>{{ group.name }}</h1>

    <div class="group-info">
      <p><strong>Invite Code:</strong> {{ group.inviteCode }}</p>
      <p><strong>Total Spent:</strong> ${{ group.totalSpent?.toFixed(2) || '0.00' }}</p>
    </div>

    <h2>Members:</h2>
    <ul>
      <li v-for="(displayName, uid) in memberDisplayNames" :key="uid">
        {{ displayName }}
      </li>
    </ul>

    <button class="leave-btn" @click="confirmLeaveGroup">Leave Group</button>
  </div>

  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth } from "@/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayRemove
} from "firebase/firestore";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const groupId = route.params.id;
    const group = ref(null);
    const memberDisplayNames = ref({});

    const fetchGroupDetails = async () => {
      try {
        const groupRef = doc(db, "Groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const data = groupSnap.data();
          group.value = data;
          fetchMemberDisplayNames(data.members);
        } else {
          console.error("Group not found.");
        }
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };

    const fetchMemberDisplayNames = async (memberUIDs) => {
      const displayMap = {};
      for (const uid of memberUIDs) {
        try {
          const userDoc = await getDoc(doc(db, "Users", uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            displayMap[uid] = userData.displayName || "Unnamed User";
          } else {
            displayMap[uid] = "Unknown User";
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          displayMap[uid] = "Error Loading Name";
        }
      }
      memberDisplayNames.value = displayMap;
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

  const groupRef = doc(db, "groups", groupId);
  const userGroupRef = doc(db, "Users", user.uid, "groups", groupId);

  try {
    // 1. Remove user from the group members array
    await updateDoc(groupRef, {
      members: arrayRemove(user.uid)
    });

    // 2. Delete group from user's subcollection
    await deleteDoc(userGroupRef);

    // 3. Fetch updated group to check if empty
    const updatedGroupSnap = await getDoc(groupRef);
    if (updatedGroupSnap.exists()) {
      const updatedGroup = updatedGroupSnap.data();
      if (!updatedGroup.members || updatedGroup.members.length === 0) {
        // 4. Delete the entire group if no members remain
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

    return {
      group,
      memberDisplayNames,
      confirmLeaveGroup
    };
  }
};
</script>

<style scoped>
.family-details {
  max-width: 600px;
  margin: 2rem auto;
  padding: 3rem;
  background: #fff;
  border-radius: 2rem;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

/* Responsiveness to mobile */
@media (max-width: 800px) {
  .family-details {
    width: 80%;
  }
}

.back-btn {
  background: var(--color-accent-dark);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.leave-btn {
  background-color: #e57373;
  color: white;
  padding: 0.625rem 1.25rem;
  margin-top: 1.25rem;
  border: none;
  cursor: pointer;
  border-radius: 0.3125rem;
  font-size: 1rem;
}

.group-info p {
  font-size: 1.125rem;
  margin: 0.3125rem 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  background: #f4f4f4;
  margin: 0.5rem 0;
  padding: 0.8rem;
  border-radius: 0.5rem;
}

.loading {
  text-align: center;
  font-size: 1.125rem;
  color: gray;
  margin-top: 1.25rem;
}
</style>
