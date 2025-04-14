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
          <img src="/images/inbox-icon.png" alt="Inbox" class="inbox-icon" @click="toggleInbox" />
          <button class="back-btn" @click="$router.back()">← Back</button>
          <button class="leave-btn" @click="confirmLeaveGroup">Leave Family</button>
        </div>
        <p class="total">Total: ${{ totalSpent.toFixed(2) }}</p>
      </div>
    </div>

    <FamilyBarChart :members="memberSpendingData" v-if="memberSpendingData.length" />

    <div>
      <HighlightCard 
        v-for="highlight in highlights" 
        :key="highlight.id" 
        :title="highlight.Title"
        :amount="highlight.Amount" 
        :userName="highlight.UserName" 
        :date="highlight.Date"
        :likedBy="highlight.likedBy || []"
        :dislikedBy="highlight.dislikedBy || []"
        :groupId="groupId"
        :postId="highlight.id"
        @like="handleLike"
        @dislike="handleDislike" />
    </div>
  </div>

  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>

  <InboxPopup
    v-if="showInbox"
    :messages="inboxMessages"
    @close="toggleInbox"
  />
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, auth } from "@/firebase";
import {
  doc, getDoc, getDocs, collection,
  updateDoc, deleteDoc, arrayUnion, arrayRemove,
  onSnapshot
} from "firebase/firestore";
import FamilyBarChart from "@/components/FamilyBarChart.vue";
import HighlightCard from "@/components/HighlightCard.vue";
import InboxPopup from "@/components/Family/InboxPopup.vue";

export default {
  components: {
    HighlightCard,
    FamilyBarChart,
    InboxPopup
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isUpdating = ref(false);
    const groupId = route.params.id;
    const group = ref(null);
    const highlights = ref([]);
    const memberDisplayNames = ref({});
    const memberSpendingData = ref([]);
    const showInbox = ref(false,
      currentUser: null);
    const inboxMessages = ref([]);

    const totalSpent = computed(() => {
      return memberSpendingData.value.reduce((sum, member) => {
        return sum + Object.values(member.categories).reduce((a, b) => a + b, 0);
      }, 0);
    });

    const toggleInbox = async () => {
      if (!group.value || !group.value.members || group.value.members.length === 0) {
        console.warn("Group or members not ready yet. Skipping inbox load.");
        return;
      }

      showInbox.value = !showInbox.value;
      if (showInbox.value) {
        await fetchInboxAlerts();
      }
    };

    watch(group, (newVal) => {
      if (showInbox.value && newVal?.members?.length) {
        fetchInboxAlerts();
      }
    });

    watch(totalSpent, async (newTotal) => {
      if (isUpdating.value) return;
      if (group.value) {
        const currentTotal = Number(group.value.totalSpent) || 0;
        if (Math.abs(currentTotal - newTotal) > 0.01) {
          isUpdating.value = true;
          try {
            await updateDoc(doc(db, "Groups", groupId), { totalSpent: newTotal });
          } catch (e) {
            console.error("Error updating totalSpent:", e);
          } finally {
            setTimeout(() => {
              isUpdating.value = false;
            }, 400);
          }
        }
      }
    });

    const updateGroupTotal = async (newTotal) => {
      try {
        await updateDoc(doc(db, "Groups", groupId), { totalSpent: newTotal });
        console.log("Updated group totalSpent:", newTotal);
      } catch (e) {
        console.error("Error updating totalSpent:", e);
      } finally {
        setTimeout(() => {
          isUpdating.value = false;
        }, 400);
      }
    };

    const fetchGroupDetails = async () => {
      const groupRef = doc(db, "Groups", groupId);

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

    async fetchHighlights() {
      const highlightsRef = collection(db, "Groups", this.groupId, "Highlights");
      // Use onSnapshot for real-time updates to highlights including likes/dislikes
      onSnapshot(highlightsRef, (snapshot) => {
        // Map and sort the highlights by date in descending order
        this.highlights = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.Date) - new Date(a.Date)); // Sort by date (most recent first)

        console.log("Fetched and sorted Highlights:", this.highlights);
      });
    },

    const fetchMemberData = async (memberUIDs) => {
      console.log("👥fetching member data for:", memberUIDs);
      const NameMap = {};
      const tempDataMap = {};

      memberDisplayNames.value = {};
      memberSpendingData.value = [];

      const updateAllCharts = () => {
        const allReady = memberUIDs.every(uid => tempDataMap[uid]);
        if (allReady) {
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

          tempDataMap[uid] = {
            name: displayName,
            categories: { ...categoryMap }
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

          tempDataMap[uid] = {
            name: displayName,
            categories: { ...categoryMap }
          };

          updateAllCharts();
        });
      }
    },

    async handleLike(postId) {
      if (!auth.currentUser) {
        alert("You must be logged in to like posts");
        return;
      }
      
      const userId = auth.currentUser.uid;
      const highlightRef = doc(db, "Groups", this.groupId, "Highlights", postId);
      
      try {
        const highlightDoc = await getDoc(highlightRef);
        if (!highlightDoc.exists()) {
          console.error("Highlight not found");
          return;
        }
        
        const highlightData = highlightDoc.data();
        const likedBy = highlightData.likedBy || [];
        const dislikedBy = highlightData.dislikedBy || [];
        
        // Check if user already liked
        if (likedBy.includes(userId)) {
          // User already liked, remove like
          await updateDoc(highlightRef, {
            likedBy: arrayRemove(userId)
          });
          console.log("Like removed");
        } else {
          // Add like and remove dislike if exists
          await updateDoc(highlightRef, {
            likedBy: arrayUnion(userId),
            dislikedBy: dislikedBy.includes(userId) ? arrayRemove(userId) : dislikedBy
          });
          console.log("Like added");
        }
      } catch (error) {
        console.error("Error handling like:", error);
      }
    },
    
    async handleDislike(postId) {
      if (!auth.currentUser) {
        alert("You must be logged in to dislike posts");
        return;
      }
      
      const userId = auth.currentUser.uid;
      const highlightRef = doc(db, "Groups", this.groupId, "Highlights", postId);
      
      try {
        const highlightDoc = await getDoc(highlightRef);
        if (!highlightDoc.exists()) {
          console.error("Highlight not found");
          return;
        }
        
        const highlightData = highlightDoc.data();
        const likedBy = highlightData.likedBy || [];
        const dislikedBy = highlightData.dislikedBy || [];
        
        // Check if user already disliked
        if (dislikedBy.includes(userId)) {
          // User already disliked, remove dislike
          await updateDoc(highlightRef, {
            dislikedBy: arrayRemove(userId)
          });
          console.log("Dislike removed");
        } else {
          // Add dislike and remove like if exists
          await updateDoc(highlightRef, {
            dislikedBy: arrayUnion(userId),
            likedBy: likedBy.includes(userId) ? arrayRemove(userId) : likedBy
          });
          console.log("Dislike added");
        }
      } catch (error) {
        console.error("Error handling dislike:", error);
      }
    },

    const confirmLeaveGroup = async () => {
      const confirmed = window.confirm("Are you sure you want to leave this group?");
      if (!confirmed) return;

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const groupRef = doc(db, "Groups", groupId);
      const userGroupRef = doc(db, "Users", user.uid, "Groups", groupId);

      try {
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid)
        });

        await deleteDoc(doc(db, "Users", user.uid, "groups", groupId));

        const updatedGroupSnap = await getDoc(groupRef);
        if (updatedGroupSnap.exists() && (!updatedGroupSnap.data().members || updatedGroupSnap.data().members.length === 0)) {
          await deleteDoc(groupRef);
        }

        alert("You have left the group.");
        router.push("/family");
      } catch (err) {
        console.error("Error leaving group:", err);
        alert("Failed to leave group.");
      }
    };

    const fetchInboxAlerts = async () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`;
      const monthText = now.toLocaleString("default", { month: "long", year: "numeric" });

      inboxMessages.value = [];

      for (const uid of group.value.members) {
        const userDoc = await getDoc(doc(db, "Users", uid));
        const userName = userDoc.exists() ? userDoc.data().displayName || "Unnamed User" : "Unknown";

        const goalRef = doc(db, "Users", uid, "Goals", monthKey);
        const goalSnap = await getDoc(goalRef);
        if (!goalSnap.exists()) continue;

        const goals = goalSnap.data();
        if (!goals?.categories) continue;

        const alertDocRef = doc(db, "Groups", groupId, "Alerts", `${uid}-${monthKey}`);
        const alertDocSnap = await getDoc(alertDocRef);
        const previousAlerts = alertDocSnap.exists() ? alertDocSnap.data().alerts || [] : [];

        const newAlerts = [];

        for (const cat of goals.categories) {
          const prev = previousAlerts.find(a => a.category === cat.name);

          if (prev && prev.type === "limit-set" && prev.amount !== cat.setAmount) {
            inboxMessages.value.push({ user: userName, category: cat.name, type: "limit-updated", originalLimit: prev.amount, newLimit: cat.setAmount, monthText });
            newAlerts.push({ type: "limit-set", category: cat.name, amount: cat.setAmount });
          }

          const alreadyExceeded = previousAlerts.find(a => a.type === "limit-exceeded" && a.category === cat.name);
          if (!alreadyExceeded && cat.spent > cat.setAmount) {
            inboxMessages.value.push({ user: userName, category: cat.name, type: "limit-exceeded", limit: cat.setAmount, monthText });
            newAlerts.push({ type: "limit-exceeded", category: cat.name });
          }

          if (!prev) {
            newAlerts.push({ type: "limit-set", category: cat.name, amount: cat.setAmount });
          }
        }

        if (newAlerts.length > 0) {
          await setDoc(alertDocRef, {
            userId: uid,
            userName,
            month: monthKey,
            alerts: newAlerts
          }, { merge: true });
        }
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
      highlights,
      showInbox,
      inboxMessages,
      toggleInbox
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