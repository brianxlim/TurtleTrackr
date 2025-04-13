<template>
  <div v-if="group" class="family-details">
    <div class="group-header-box">

      <div class="left">
        <h2>{{ group.name }}</h2>
        <p class="subtext">{{ Object.values(memberDisplayNames).join(", ") }}</p>
        <p class="group-id">Group ID: {{ group.inviteCode }}</p>
      </div>

      <div class="right">
        <div class="icon-leave-wrap">
          <img
            src="/images/inbox-icon.png"
            alt="Inbox"
            class="inbox-icon"
            @click="toggleInbox"
          />
          <button class="back-btn" @click="$router.back()">← Back</button>
          <button class="leave-btn" @click="confirmLeaveGroup">Leave Family</button>
        </div>
        <p class="total">Total: ${{ totalSpent.toFixed(2) }}</p>
      </div>
    </div>

    <FamilyBarChart :members="memberSpendingData" v-if="memberSpendingData.length" />

    <div>
      <h2 id= "highlightTitle">Highlights: </h2>
      <HighlightCard v-for="highlight in highlights" :key="highlight.id" :title="highlight.Title"
        :amount="highlight.Amount" :userName="highlight.UserName" :date="highlight.Date" />
    </div>
  </div>

  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth } from "@/firebase";
import {
  doc, getDoc, getDocs, collection,
  updateDoc, deleteDoc,
  arrayRemove, onSnapshot
} from "firebase/firestore";
import FamilyBarChart from "@/components/FamilyBarChart.vue";
import HighlightCard from "@/components/HighlightCard.vue";

export default {
  components: {
    HighlightCard,
    FamilyBarChart
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isUpdating = ref(false);
    const groupId = route.params.id;
    const groupRef = doc(db, "Groups", groupId);
    const group = ref(null);
    const highlights = ref([]);
    const memberDisplayNames = ref({});
    const memberSpendingData = ref([]);
    const totalSpent = computed(() => {
      return memberSpendingData.value.reduce((sum, member) => {
        return sum + Object.values(member.categories).reduce((a, b) => a + b, 0);
      }, 0);
    });

    watch(totalSpent, async (newTotal) => {
      if (isUpdating.value) return; // Ignore changes while updating.
      if (group.value) {
        const currentTotal = Number(group.value.totalSpent) || 0;
        if (Math.abs(currentTotal - newTotal) > 0.01) {
          isUpdating.value = true;
          try {
            await updateDoc(doc(db, "Groups", groupId), { totalSpent: newTotal });
            console.log("Updated group totalSpent:", newTotal);
          } catch (e) {
            console.error("Error updating totalSpent:", e);
          } finally {
            // Slight delay to ensure the snapshot has processed the update
            setTimeout(() => {
              isUpdating.value = false;
            }, 400);
          }
        }
      }
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
    async function fetchHighlights() {
      const highlightsRef = collection(db, "Groups", groupId, "Highlights");
      const snapshot = await getDocs(highlightsRef);
      highlights.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log("Fetched Highlights:", highlights.value);
    }

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

    onMounted(async () => {
      await fetchGroupDetails();
      await fetchHighlights();
    });

    return {
      group,
      memberDisplayNames,
      memberSpendingData,
      confirmLeaveGroup,
      totalSpent,
      highlights
    };
  }
};
</script>

<style scoped>
.family-details {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
  padding: 20px;
  margin-top: 1%;
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
  margin: 1rem 0 0 0;
}

.leave-btn {
  background-color: #e57373;
  color: white;
  padding: 10px 20px;
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

.group-header-box {
  background-color: #3d5538;
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.group-header-box .left {
  flex: 1 1 60%;
}

.group-header-box .right {
  flex: 1 1 35%;
  text-align: right;
}

.group-header-box h2 {
  margin: 0;
  font-size: 24px;
}

.group-header-box .subtext {
  font-size: 14px;
  color: #dcdcdc;
  margin-top: 4px;
}

.group-header-box .group-id {
  font-size: 14px;
  margin-top: 4px;
  color: #c8c8c8;
}

.group-header-box .total {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.group-header-box .leave-btn {
  background-color: #e8bb82;
  color: black;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.group-header-box .leave-btn:hover {
  background-color: #dfaa63;
}
#highlightTitle {
  text-align: left;
}

.icon-leave-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.inbox-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.inbox-icon:hover {
  transform: scale(1.1);
}
</style>
