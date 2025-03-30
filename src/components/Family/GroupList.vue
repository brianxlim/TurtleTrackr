
<template>
    <div v-if="groups.length > 0" class="group-list">
      <GroupCard
        v-for="group in groups"
        :key="group.id"
        :group="group"
        @select="handleSelect"
      />
    </div>
</template>

<script setup>
import GroupCard from './GroupCard.vue';

const props = defineProps({
    groups: {
        type: Array,
        default: () => []
    }
});
const emit = defineEmits(['groupSelected']);

const handleSelect = (groupId) => {
    emit('groupSelected', groupId);
};
</script>

<style scoped>
.group-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1.875rem;
    justify-content: center;
}
</style>
  