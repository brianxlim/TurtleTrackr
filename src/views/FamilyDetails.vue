<template>
  <div v-if="group" class="family-details">
    <button class="back-btn" @click="$router.push('/family')">← Back</button>
    
    <h1>{{ group.name }}</h1>

    <div class="group-info">
      <p><strong>Invite Code:</strong> {{ group.groupCode }}</p>
      <p><strong>Total Spent:</strong> ${{ group.totalSpent.toFixed(2) }}</p>
    </div>

    <h2>Members:</h2>
    <ul>
      <li v-for="member in group.members" :key="member">{{ member }}</li>
    </ul>
  </div>

  <!-- Loading State -->
  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRoute } from "vue-router";
import { ref, onMounted } from "vue";

export default {
  setup() {
    const route = useRoute();
    const group = ref(null);

    const fetchGroupDetails = async () => {
      try {
        console.log("Fetching group with ID:", route.params.id); // Debugging
        const groupRef = doc(db, "groups", route.params.id);
        const docSnap = await getDoc(groupRef);

        if (docSnap.exists()) {
          group.value = docSnap.data();
        } else {
          console.error("Group not found!");
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    };

    onMounted(fetchGroupDetails);

    return { group };
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
