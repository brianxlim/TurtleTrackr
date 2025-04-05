<template>
  <div v-if="group" class="family-details">
    <button class="back-btn" @click="$router.back()">← Back</button>

    <h1>{{ group.name }}</h1>

    <div class="group-info">
      <p><strong>Invite Code:</strong> {{ group.inviteCode }}</p>
      <p><strong>Total Spent:</strong> ${{ totalSpent.toFixed(2) }}</p>
    </div>

    <FamilyBarChart :members="memberSpendingData" v-if="memberSpendingData.length" />

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
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth } from "@/firebase";
import {
  doc, getDoc, collection,
  updateDoc, deleteDoc,
  arrayRemove, onSnapshot
} from "firebase/firestore";
import FamilyBarChart from "@/components/FamilyBarChart.vue";

export default {
  components: {
    FamilyBarChart
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const groupId = route.params.id;
    const group = ref(null);
    const memberDisplayNames = ref({});
    const memberSpendingData = ref([]);
    const totalSpent = computed(() => {
      return memberSpendingData.value.reduce((sum, member) => {
        return sum + Object.values(member.categories).reduce((a, b) => a + b, 0);
      }, 0);
    });

    const fetchGroupDetails = async () => {
      const groupRef = doc(db, "Groups", groupId);

      //onsnapshot to listen to real life update(not working yet)
      onSnapshot(groupRef, (groupSnap) => {
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          group.value = data;
          fetchMemberData(data.members);
        } else {
          console.error("Group not found.");
        }
      });
    };

    const fetchMemberData = async (memberUIDs) => {
      console.log("👥fetching member data for:", memberUIDs);
      const NameMap = {};
      const tempDataMap = {};
      const unsubscribes = [];

      memberDisplayNames.value = {};
      memberSpendingData.value = [];

      const updateAllCharts = () => {
        console.log("📌showing tempdataMap right update:", JSON.stringify(tempDataMap, null, 2));
        const allReady = memberUIDs.every(uid => tempDataMap[uid]);
        if (allReady) {
          console.log("✅all member data ready.Updating chart now with:", tempDataMap);
          const updatedData = memberUIDs.map(uid => tempDataMap[uid]);
          memberSpendingData.value = updatedData;
        }
      };

      for (const uid of memberUIDs) {
        const userDoc = await getDoc(doc(db, "Users", uid));
        let displayName = "Unnamed User";

        if (userDoc.exists()) {
          const data = userDoc.data();
          displayName = data.displayName || displayName;
          NameMap[uid] = displayName;
          memberDisplayNames.value = { ...NameMap };
        }

        const categoryMap = {
          Food: 0,
          Travel: 0,
          Shopping: 0,
          Others: 0
        };

        const expensesUnsub = onSnapshot(collection(db, "Users", uid, "Expenses"), (snap) => {
          categoryMap.Food = 0;
          categoryMap.Travel = 0;
          categoryMap.Shopping = 0;
          categoryMap.Others = 0;

          snap.forEach(doc => {
            const data = doc.data();
            const amount = parseFloat(data.Amount) || 0;
            const category = data.Category || "Others";
            categoryMap[category] += amount;
          });

          console.log(`🧾 [Expenses Update] for ${displayName}:`, categoryMap);

          tempDataMap[uid] = {
            name: displayName,
            categories: {
              ...(tempDataMap[uid]?.categories || {}),
              ...categoryMap
            }
          };

          updateAllCharts();
        });

        const goalsUnsub = onSnapshot(collection(db, "Users", uid, "Goals"), (snap) => {
          snap.forEach(doc => {
            const data = doc.data();
            const amount = parseFloat(data.Amount) || 0;
            const category = data.Category || "Others";
            categoryMap[category] += amount;
          });

          console.log(`🎯 [Goals Update] for ${displayName}:`, categoryMap);

          tempDataMap[uid] = {
            name: displayName,
            categories: { ...categoryMap }
          };

          updateAllCharts();
        });

        unsubscribes.push(expensesUnsub, goalsUnsub);
      }
    };


    const confirmLeaveGroup = async () => {
      const confirmed = window.confirm("Are you sure you want to leave this group?");
      if (!confirmed) return;

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const groupRef = doc(db, "Groups", groupId);
      const userGroupRef = doc(db, "Users", user.uid, "groups", groupId);

      try {
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid)
        });

        await deleteDoc(userGroupRef);

        const updatedGroupSnap = await getDoc(groupRef);
        if (updatedGroupSnap.exists()) {
          const updatedGroup = updatedGroupSnap.data();
          if (!updatedGroup.members || updatedGroup.members.length === 0) {
            await deleteDoc(groupRef);
            console.log("Group deleted as no members remain.");
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
      memberSpendingData,
      confirmLeaveGroup,
      totalSpent
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

.leave-btn {
  background-color: #e57373;
  color: white;
  padding: 10px 20px;
  margin-top: 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
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
