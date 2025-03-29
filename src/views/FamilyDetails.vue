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
      <li v-for="member in group.members" :key="member">{{ member }}</li>
    </ul>
  </div>

  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default {
  setup() {
    const route = useRoute();
    const group = ref(null);

    const fetchGroupDetails = async () => {
      try {
        const groupRef = doc(db, "groups", route.params.id);
        const docSnap = await getDoc(groupRef);

        if (docSnap.exists()) {
          group.value = docSnap.data();
        } else {
          console.error("Group not found");
        }
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };

    onMounted(fetchGroupDetails);

    return {
      group
    };
  }
};
</script>

<style scoped>
.family-details {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: #627EA4;
  color: white;
  padding: 8px 12px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 20px;
}

.group-info p {
  font-size: 18px;
  margin: 5px 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  background: #f4f4f4;
  margin: 5px 0;
  padding: 10px;
  border-radius: 5px;
}

.loading {
  text-align: center;
  font-size: 18px;
  color: gray;
  margin-top: 20px;
}
</style>
