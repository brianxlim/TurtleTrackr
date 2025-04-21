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
          <div class="inbox-container">
            <img src="/images/inbox-icon.png" alt="Inbox" class="inbox-icon" @click="toggleInbox" />
            <div v-if="hasUnreadMessages" class="unread-indicator"></div>
            <div v-if="isLoadingInbox && !showInbox" class="loading-spinner"></div>
          </div>
          <button class="back-btn" @click="$router.back()">← Back</button>
          <button class="leave-btn" @click="confirmLeaveGroup">Leave Family</button>
        </div>
        <p class="total">Total: ${{ totalSpent.toFixed(2) }}</p>
      </div>
    </div>


    <div class="month-bar">
      <button class="nav-arrow" @click="prevMonth">«</button>
      <span class="month-title">{{ formattedMonth }}</span>
      <button class="nav-arrow" @click="nextMonth">»</button>
    </div>


    <FamilyBarChart 
      v-if="memberSpendingData.length"
      :members="memberSpendingData"
      @member-click="goToMember"
      :month="selectedMonth" 
      :selectedCategory="selectedCategory"
    />


    <div class="highlight-section">
      <h2 id="highlightTitle">Highlights: </h2>
      <HighlightCard 
        v-for="highlight in highlights"
        :key="highlight.id"
        :title="highlight.Title"
        :amount="highlight.Amount"
        :userId="highlight.UserId"
        :date="highlight.Date"
        :likedBy="highlight.likedBy || []" 
        :dislikedBy="highlight.dislikedBy || []" :groupId="groupId"
        :postId="highlight.id" @like="handleLike" @dislike="handleDislike" />
    </div>
  </div>

  <div v-else class="loading">
    <p>Loading group details...</p>
  </div>

  <div v-if="selectedMemberUid" class="modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="selectedMemberUid = null">✖</button>
      <History :uid="selectedMemberUid" />
    </div>
  </div>

  <InboxPopup v-if="showInbox" :messages="filteredInboxMessages" :isLoading="isLoadingInbox" @close="toggleInbox"
    @mark-read="markMessageAsRead" />
</template>

<script>
import { db, auth } from "@/firebase";
import {
  doc, getDoc, getDocs, collection,
  updateDoc, deleteDoc, setDoc,
  arrayUnion, arrayRemove, onSnapshot
} from "firebase/firestore";
import FamilyBarChart from "@/components/FamilyBarChart.vue";
import HighlightCard from "@/components/HighlightCard.vue";
import InboxPopup from "@/components/Family/InboxPopup.vue";
import History from "@/views/History.vue";

export default {
  props: ['id'],

  components: {
    HighlightCard,
    History,
    FamilyBarChart,
    InboxPopup
  },
  data() {

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return {
      totalSpent: 0,
      totalSpentCalculated: false,
      isUpdating: false,
      groupId: this.$route.params.id,
      group: null,
      highlights: [],
      memberDisplayNames: {},
      memberSpendingData: [],
      showInbox: false,
      inboxMessages: [],
      readMessageIds: new Set(), // Track read messages
      isLoadingInbox: false,
      currentUser: null,
      selectedMemberUid: null,
      selectedMonth: defaultMonth,
      availableMonths: Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    };
  },
  computed: {
    formattedMonth() {
      const [year, month] = this.selectedMonth.split("-");
      const date = new Date(year, month - 1);
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    },

    hasUnreadMessages() {
      if (!this.inboxMessages || this.inboxMessages.length === 0) return false;
      return this.inboxMessages.some(msg => !msg.read && !this.readMessageIds.has(msg.id));
    },

    filteredInboxMessages() {
      // Filter out messages that have been marked as read locally
      return this.inboxMessages.filter(msg => !this.readMessageIds.has(msg.id));
    }
  },

  watch: {
    group(newVal) {
      if (newVal?.members?.length) {
        // Check for unread messages when group data is loaded
        this.checkForUnreadMessages();
      }
    },
  },
  methods: {
    async toggleInbox() {
      if (!this.group || !this.group.members || this.group.members.length === 0) {
        console.warn("Group or members not ready yet. Skipping inbox load.");
        return;
      }

      this.showInbox = !this.showInbox;
      if (this.showInbox) {
        await this.fetchInboxAlerts();
      }
    },

    goToMember(uid) {
      console.log("📥 Received click for member uid:", uid);
      this.selectedMemberUid = uid;
    },

    async updateGroupTotal(newTotal) {
      try {
        await updateDoc(doc(db, "Groups", this.groupId), { totalSpent: newTotal });
        console.log("Updated group totalSpent:", newTotal);
      } catch (e) {
        console.error("Error updating totalSpent:", e);
      } finally {
        setTimeout(() => {
          this.isUpdating = false;
        }, 400);
      }
    },

    async fetchGroupDetails() {
      const groupRef = doc(db, "Groups", this.groupId);

      onSnapshot(groupRef, (groupSnap) => {
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          this.group = data;
          this.fetchMemberData(data.members);
        } else {
          console.error("Group not found.");
        }
      });
    },

    async checkForUnreadMessages() {
      // This method just checks if there are unread messages without loading all messages
      if (!auth.currentUser) return;

      const currentUserId = auth.currentUser.uid;

      try {
        this.isLoadingInbox = true;
        const alertsRef = collection(db, "Groups", this.groupId, "Alerts");
        const alertsSnap = await getDocs(alertsRef);

        // Check if any alert has unread messages for current user
        let hasUnread = false;
        for (const doc of alertsSnap.docs) {
          const alertData = doc.data();
          if (alertData.alerts && Array.isArray(alertData.alerts)) {
            const unreadExists = alertData.alerts.some(alert =>
              !Array.isArray(alert.readBy) || !alert.readBy.includes(currentUserId)
            );

            if (unreadExists) {
              hasUnread = true;
              break;
            }
          }
        }

        this.isLoadingInbox = false;
      } catch (error) {
        console.error("Error checking for unread messages:", error);
        this.isLoadingInbox = false;
      }
    },

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

    async fetchMemberData(memberUIDs) {
      console.log("👥fetching member data for:", memberUIDs);
      const NameMap = {};
      const tempDataMap = {};

      this.memberDisplayNames = {};
      this.memberSpendingData = [];

      const updateAllCharts = () => {
        const allReady = memberUIDs.every(uid => tempDataMap[uid]);
        if (allReady) {
          const updatedData = memberUIDs.map(uid => tempDataMap[uid]);
          this.memberSpendingData = updatedData;
          if (!this.totalSpentCalculated) {
            const selectedMonth = this.selectedMonth;
            this.totalSpent = updatedData.reduce((sum, member) => {
              const monthData = member.monthlyBreakdown?.[selectedMonth] || {};
              return sum + Object.values(monthData).reduce((a, b) => a + b, 0);
            }, 0);
            this.totalSpentCalculated = true;
          }
        }
      };

      for (const uid of memberUIDs) {
        const userDoc = await getDoc(doc(db, "Users", uid));
        let displayName = "Unnamed User";

        if (userDoc.exists()) {
          const data = userDoc.data();
          displayName = data.displayName || displayName;
          NameMap[uid] = displayName;
          this.memberDisplayNames = { ...NameMap };
        }

        const categoryMap = {
          Food: 0,
          Travel: 0,
          Shopping: 0,
          Others: 0
        };

        const expensesUnsub = onSnapshot(collection(db, "Users", uid, "Expenses"), (snap) => {
          const monthMap = {};

          snap.forEach((doc) => {
            const data = doc.data();
            const amount = parseFloat(data.Amount) || 0;
            const category = data.Category || "Others";
            const date = new Date(data.Date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthMap[monthKey]) {
              monthMap[monthKey] = { Food: 0, Travel: 0, Shopping: 0, Others: 0 };
            }

            if (!monthMap[monthKey][category]) {
              monthMap[monthKey][category] = 0;
            }

            monthMap[monthKey][category] += amount;
          });

          tempDataMap[uid] = {
            ...(tempDataMap[uid] || {}),
            uid,
            name: displayName,
            monthlyBreakdown: { ...monthMap },
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
            ...(tempDataMap[uid] || {}),
            uid,
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

    prevMonth() {
      const [year, month] = this.selectedMonth.split("-").map(Number);
      const prev = new Date(year, month - 2); // month -1 is current, -2 for previous
      this.selectedMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    },

    nextMonth() {
      const [year, month] = this.selectedMonth.split("-").map(Number);
      const next = new Date(year, month); // month is current, month+1 internally
      this.selectedMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    },

    async confirmLeaveGroup() {
      const confirmed = window.confirm("Are you sure you want to leave this group?");
      if (!confirmed) return;

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const groupRef = doc(db, "Groups", this.groupId);
      const userGroupRef = doc(db, "Users", user.uid, "Groups", this.groupId);

      try {
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid)
        });

        await deleteDoc(doc(db, "Users", user.uid, "Groups", this.groupId));

        const updatedGroupSnap = await getDoc(groupRef);
        if (updatedGroupSnap.exists() && (!updatedGroupSnap.data().members || updatedGroupSnap.data().members.length === 0)) {
          await deleteDoc(groupRef);
        }

        alert("You have left the group.");
        this.$router.push("/family");
      } catch (err) {
        console.error("Error leaving group:", err);
        alert("Failed to leave group.");
      }
    },

    async fetchInboxAlerts() {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthText = now.toLocaleString("default", { month: "long", year: "numeric" });

      this.isLoadingInbox = true;

      try {
        if (!auth.currentUser) {
          console.warn("User not logged in. Cannot fetch inbox alerts.");
          this.isLoadingInbox = false;
          return;
        }

        const currentUserId = auth.currentUser.uid;

        // Fetch alerts from Firestore
        const alertsRef = collection(db, "Groups", this.groupId, "Alerts");
        const alertsSnap = await getDocs(alertsRef);

        const processedAlerts = [];

        alertsSnap.forEach(doc => {
          const alertData = doc.data();
          if (alertData.alerts && Array.isArray(alertData.alerts)) {
            alertData.alerts.forEach(alert => {
              // Format month text properly
              let formattedMonthText = monthText;
              if (alertData.month) {
                try {
                  const [alertYear, alertMonth] = alertData.month.split('-').map(Number);
                  if (!isNaN(alertYear) && !isNaN(alertMonth) && alertMonth >= 1 && alertMonth <= 12) {
                    const monthDate = new Date(alertYear, alertMonth - 1);
                    formattedMonthText = monthDate.toLocaleString("default", { month: "long", year: "numeric" });
                  }
                } catch (e) {
                  console.error("Error formatting month:", e);
                }
              }

              // Skip already locally marked as read messages
              const alertId = `${doc.id}-${alert.category || 'unknown'}-${alert.type || 'unknown'}`;
              if (this.readMessageIds.has(alertId)) {
                return;
              }

              // Create a properly formatted message object with read status
              const isRead = Array.isArray(alert.readBy) && alert.readBy.includes(currentUserId);

              processedAlerts.push({
                id: alertId,
                user: alertData.userName || "Unknown User",
                category: alert.category || "Unknown",
                type: alert.type || "unknown",
                limit: typeof alert.amount === 'number' ? alert.amount : 0,
                originalLimit: typeof alert.originalAmount === 'number' ? alert.originalAmount : 0,
                newLimit: typeof alert.amount === 'number' ? alert.amount : 0,
                monthText: formattedMonthText,
                read: isRead,
                docId: doc.id
              });
            });
          }
        });

        // Process current data to detect new limit exceedances
        if (this.group && Array.isArray(this.group.members)) {
          for (const uid of this.group.members) {
            try {
              const userDoc = await getDoc(doc(db, "Users", uid));
              const userName = userDoc.exists() ? userDoc.data().displayName || "Unnamed User" : "Unknown";

              const goalRef = doc(db, "Users", uid, "Goals", monthKey);
              const goalSnap = await getDoc(goalRef);
              if (!goalSnap.exists()) continue;

              const goals = goalSnap.data();
              if (!goals?.categories || !Array.isArray(goals.categories)) continue;

              // Find the last time we checked for this user's categories
              const userAlertsRef = doc(db, "Groups", this.groupId, "AlertsTracking", uid);
              const userAlertsSnap = await getDoc(userAlertsRef);
              const lastChecked = userAlertsSnap.exists() ? userAlertsSnap.data().lastChecked || {} : {};
              const updatedLastChecked = { ...lastChecked };

              // Check each category for potential alerts
              // Inside the fetchInboxAlerts method, replace the check for limit exceedance with this:
              for (const cat of goals.categories) {
                if (!cat || typeof cat !== 'object') continue;

                // Check if limit was exceeded since our last check
                const categoryLastChecked = lastChecked[cat.name] || 0;

                // Only create an alert if spending exceeds the limit
                if (cat.spent > cat.setAmount) {
                  // See if we already have this alert in our processed list
                  const alertId = `current-${uid}-${cat.name || 'unknown'}-exceeded`;

                  // Skip if already marked as read locally
                  if (this.readMessageIds.has(alertId)) {
                    continue;
                  }

                  const existingAlert = processedAlerts.find(
                    a => a.user === userName && a.category === cat.name && a.type === "limit-exceeded"
                  );

                  if (!existingAlert) {
                    // This is a new limit exceedance
                    const now = Date.now();
                    processedAlerts.push({
                      id: alertId,
                      user: userName,
                      category: cat.name || "Unknown",
                      type: "limit-exceeded",
                      limit: typeof cat.setAmount === 'number' ? cat.setAmount : 0,
                      monthText,
                      read: false
                    });

                    // Save the alert to Firestore for future reference
                    try {
                      const alertsDocRef = doc(db, "Groups", this.groupId, "Alerts", `user-${uid}-${Date.now()}`);
                      await setDoc(alertsDocRef, {
                        userName,
                        userId: uid,
                        month: monthKey,
                        createdAt: now,
                        alerts: [{
                          category: cat.name,
                          type: "limit-exceeded",
                          amount: cat.setAmount,
                          timestamp: now,
                          readBy: []
                        }]
                      });
                    } catch (e) {
                      console.error("Error saving new alert to Firestore:", e);
                    }
                  }

                  // Update the last checked time for this category
                  updatedLastChecked[cat.name] = Date.now();
                }
              }

              // Update the last checked timestamps in Firestore
              try {
                await setDoc(userAlertsRef, { lastChecked: updatedLastChecked }, { merge: true });
              } catch (e) {
                console.error("Error updating alerts tracking:", e);
              }
            } catch (error) {
              console.error(`Error processing alerts for member ${uid}:`, error);
            }
          }
        } else {
          console.warn("Group or members not available for alert processing");
        }

        // Sort by read status (unread first)
        processedAlerts.sort((a, b) => {
          if (a.read === b.read) return 0;
          return a.read ? 1 : -1;
        });

        this.inboxMessages = processedAlerts;
        this.isLoadingInbox = false;

      } catch (error) {
        console.error("Error fetching inbox alerts:", error);
        this.isLoadingInbox = false;
      }
    },

    // Method to mark a single message as read (called from InboxPopup)
    async markMessageAsRead(message) {
      if (!auth.currentUser || message.read) return;

      const currentUserId = auth.currentUser.uid;

      try {
        // First, add to local readMessageIds to remove it from UI immediately
        this.readMessageIds.add(message.id);

        // Check if it's a message stored in Firestore that we need to update
        if (message.docId) {
          const alertRef = doc(db, "Groups", this.groupId, "Alerts", message.docId);
          const alertDoc = await getDoc(alertRef);

          if (alertDoc.exists()) {
            const alertData = alertDoc.data();
            if (alertData.alerts && Array.isArray(alertData.alerts)) {
              // Find the specific alert within the document
              const updatedAlerts = alertData.alerts.map(alert => {
                if (alert.category === message.category && alert.type === message.type) {
                  // Add current user to readBy array
                  const readBy = Array.isArray(alert.readBy) ? [...alert.readBy] : [];
                  if (!readBy.includes(currentUserId)) {
                    readBy.push(currentUserId);
                  }
                  return { ...alert, readBy };
                }
                return alert;
              });

              // Update the document with marked-as-read alert
              await updateDoc(alertRef, { alerts: updatedAlerts });
            }
          }
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  },
  mounted() {
    this.fetchGroupDetails();
    this.fetchHighlights();
    // Initial check for unread messages
    if (auth.currentUser) {
      this.checkForUnreadMessages();
    }
  }
};
</script>

<style scoped>
/* Add these new styles for the unread indicator and loading spinner */
.inbox-container {
  position: relative;
  display: inline-block;
}

.unread-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  background-color: #ff4d4f;
  border-radius: 50%;
}

.loading-spinner {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.family-details {
  max-width: 1000px;
  margin: 1rem auto;
  text-align: center;
  padding: 20px;
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
  background-color: var(--color-secondary-dark);
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
  background-color: var(--color-secondary-dark);
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: var(--color-secondary-medium);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 10px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 18px;
  cursor: pointer;
  background: none;
  border: none;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.month-title {
  font-size: 1.5rem;
  font-weight: bold;
  flex: 1;
  text-align: center;
}

.nav-arrow {
  background-color: #e4dccd;
  border: none;
  font-size: 1.2rem;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
}

.category-wrap {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  margin-left: auto;
}

.category-wrap button {
  padding: 6px 12px;
  border: 1px solid black;
  background-color: #eee;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
}

.category-wrap button.active {
  background-color: #3d5538;
  color: white;
  border-color: #3d5538;
}
</style>