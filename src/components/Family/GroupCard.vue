<template>
    <div
        class="group-card"
        @click="selectGroup"
        :style="{ borderColor: (group.color || '#ccc') + '88' }"
    >
        <div
            class="group-header"
            :style="{
            backgroundColor: group.color || '#e0e0e0',
            color: getTextColor(group.color || '#e0e0e0')
            }"
        >
            <h2>{{ group.name }}</h2>
        </div>
        <div class="group-body">
            <img :src="group.image || '/images/default.png'" alt="Group Image" class="group-image" />
            <p class="group-members">{{ group.members.length }} Members</p>
            <p class="group-total">Total: ${{ group.totalSpent.toFixed(2) }}</p>
            <p class="group-code">Invite Code: <span>{{ group.inviteCode }}</span></p>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    group: {
    type: Object,
    required: true
    }
});
const emit = defineEmits(['select']);

const getTextColor = (bgColor) => {
    if (!bgColor) return "#000";
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? "#000" : "#fff";
};

const selectGroup = () => {
    emit('select', props.group.id);
};
</script>

<style scoped>
.group-card {
    width: 15.625rem; 
    border-radius: 0.75rem; 
    background: #fff;
    border: 0.25rem solid #ccc; 
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    cursor: pointer;
}

.group-card:hover {
    transform: translateY(-0.375rem) scale(1.02);
    box-shadow: 0 0.375rem 1rem rgba(0, 0, 0, 0.15);
}

.group-header {
    padding: 1rem; 
    font-size: 1.25rem; 
    font-weight: 700;
}

.group-body {
    padding: 1.25rem; 
    text-align: center;
}

.group-image {
    width: 5.625rem; 
    height: 5.625rem; 
    object-fit: cover;
    border-radius: 100%;
    margin-bottom: 0.75rem; 
    border: 0.125rem solid #ccc; 
}

.group-members,
.group-total,
.group-code {
    margin: 0.3125rem 0;
    font-size: 0.875rem;
    color: #444;
}
</style>
  