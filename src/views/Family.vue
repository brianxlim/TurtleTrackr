<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useFamilyStore } from "@/stores/FamilyStores";
import { db } from "@/firebase";
import { updateDoc, doc } from "firebase/firestore";

import FamilyHeader from "@/components/Family/FamilyHeader.vue";
import GroupList from "@/components/Family/GroupList.vue";
import CreateGroupModal from "@/components/Family/CreateGroupModal.vue";
import JoinGroupModal from "@/components/Family/JoinGroupModal.vue";

const loading = ref(true);
const router = useRouter();
const familyStore = useFamilyStore();

const groups = computed(() => familyStore.groups);

const showCreateGroupModal = ref(false);
const showJoinGroupModal = ref(false);

const openCreateModal = () => {
  showCreateGroupModal.value = true;
};
const closeCreateModal = () => {
  showCreateGroupModal.value = false;
};
const openJoinModal = () => {
  showJoinGroupModal.value = true;
};
const closeJoinModal = () => {
  showJoinGroupModal.value = false;
};

const goToGroupDetails = (groupId) => {
  router.push({ name: "FamilyDetails", params: { id: groupId } });
};

const refreshGroups = () => {
  if (familyStore.isListening) return;
  familyStore.listenToUserGroups();
};

// 🔁 Updates Firestore `totalSpent` field for each group
const updateTotalSpent = async () => {
  for (const group of groups.value) {
    if (!group || !group.members || !Array.isArray(group.members)) continue;

    let total = 0;
    for (const member of group.members) {
      const userDoc = await import("firebase/firestore").then(({ getDoc }) =>
        getDoc(doc(db, "Users", member))
      );
      if (userDoc.exists()) {
        const expensesRef = await import("firebase/firestore").then(({ collection, getDocs }) =>
          getDocs(collection(db, "Users", member, "Expenses"))
        );
        expensesRef.forEach((expenseDoc) => {
          const expense = expenseDoc.data();
          if (expense.Amount && !isNaN(expense.Amount)) {
            total += Number(expense.Amount);
          }
        });
      }
    }

    try {
      await updateDoc(doc(db, "Groups", group.id), {
        totalSpent: total,
      });
    } catch (e) {
      console.error("Failed to update totalSpent for group", group.id, e);
    }
  }
};

onMounted(async () => {
  if (!familyStore.initialLoadComplete) {
    loading.value = true;
    await familyStore.listenToUserGroups();
  } else {
    loading.value = false;
  }

  await updateTotalSpent(); // 🔁 Auto-update on tab enter
});

onBeforeUnmount(async () => {
  await updateTotalSpent(); // 🔁 Auto-update on tab leave
});

watch(
  () => familyStore.initialLoadComplete,
  (val) => {
    if (val) loading.value = false;
  }
);
</script>

<template>
  <div class="family-container">
    <FamilyHeader @openCreate="openCreateModal" @openJoin="openJoinModal" />

    <div v-if="loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
    </div>

    <div v-else>
      <GroupList :groups="groups" @groupSelected="goToGroupDetails" />
      <div v-if="groups.length === 0" class="empty-state">
        <p>You are not part of any groups yet.</p>
      </div>
      <CreateGroupModal
        v-if="showCreateGroupModal"
        @close="closeCreateModal"
        @groupCreated="refreshGroups"
      />
      <JoinGroupModal
        v-if="showJoinGroupModal"
        @close="closeJoinModal"
        @groupJoined="refreshGroups"
      />
    </div>
  </div>
</template>

<style scoped>
.family-container {
  max-width: 70rem;
  margin: 1.25rem auto;
  padding: 0.625rem;
  border-radius: 1rem;
  text-align: center;
}
.empty-state {
  font-size: 1.125rem;
  color: #888;
  margin-top: 3.125rem;
}
</style>