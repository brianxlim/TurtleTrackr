<template>
  <div class="family-container">
    <FamilyHeader @openCreate="openCreateModal" @openJoin="openJoinModal" />
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
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import FamilyHeader from "@/components/Family/FamilyHeader.vue";
import GroupList from "@/components/Family/GroupList.vue";
import CreateGroupModal from "@/components/Family/CreateGroupModal.vue";
import JoinGroupModal from "@/components/Family/JoinGroupModal.vue";
import { useFamilyStore } from "@/stores/FamilyStores";

const router = useRouter();
const familyStore = useFamilyStore();

// Use a computed property to get groups from the store.
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
  // No need to re-subscribe if we're already listening.
  // However, if you want to force a refresh, you can stop and re-listen.
  if (familyStore.isListening) return;
  familyStore.listenToUserGroups();
};

onMounted(() => {
  // Subscribe to groups only once. The store will keep them updated.
  familyStore.listenToUserGroups();
});
</script>

<style scoped>
.family-container {
  max-width: 68.75rem;
  margin: 0 auto 1rem auto;
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
