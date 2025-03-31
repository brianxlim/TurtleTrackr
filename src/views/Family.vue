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

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import FamilyHeader from "@/components/Family/FamilyHeader.vue";
import GroupList from "@/components/Family/GroupList.vue";
import CreateGroupModal from "@/components/Family/CreateGroupModal.vue";
import JoinGroupModal from "@/components/Family/JoinGroupModal.vue";
import { useFamilyStore } from "@/stores/FamilyStores";

const loading = ref(true);
const router = useRouter();
const familyStore = useFamilyStore();

// Use computed property to retrieve groups from the store.
const groups = computed(() => familyStore.groups);

const goToGroupDetails = (groupId) => {
  router.push({ name: "FamilyDetails", params: { id: groupId } });
};

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

const refreshGroups = () => {
  // No need to re-subscribe if already listening.
  if (familyStore.isListening) return;
  familyStore.listenToUserGroups();
};

onMounted(() => {
  if (!familyStore.initialLoadComplete) {
    loading.value = true;
    familyStore.listenToUserGroups();
  } else {
    loading.value = false;
  }
});

// Watch the initialLoadComplete flag to turn off the spinner once data is loaded.
watch(
  () => familyStore.initialLoadComplete,
  (val) => {
    if (val) {
      loading.value = false;
    }
  }
);
</script>

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
