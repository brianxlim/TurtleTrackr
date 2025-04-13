<template>
    <div
        class="group-card"
        @click="selectGroup"
        :style="{ borderColor: (group.color || '#ccc') + '88' }"
    >
    <div class="group-header" :style="headerStyle">
        <h2>{{ group.name }}</h2>
    </div>
    <div class="group-body">
        <p class="group-members">{{ group.members.length }} Members</p>
        <p class="group-total">
            Total: ${{ group.totalSpent.toFixed(2) }}
        </p>
        <p class="group-code">
            Invite Code: <span>{{ group.inviteCode }}</span>
        </p>
    </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    group: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["select"]);

const getTextColor = (bgColor) => {
    if (!bgColor) return "#000";
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? "#000" : "#fff";
};

// Compute the header style based on whether an image is available.
const headerStyle = computed(() => {
  if (props.group.image && props.group.image.trim() !== "") {
    return {
      // Overlay a 30% opaque black gradient over the image.
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${props.group.image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "#fff",
      textShadow: "0px 0px 5px rgba(0, 0, 0, 0.8)"
    };
  } else {
    const color = props.group.color || "#e0e0e0";
    return {
      backgroundColor: color,
      color: getTextColor(color),
      textShadow: "0px 0px 5px rgba(0, 0, 0, 0.8)"
    };
  }
});

const selectGroup = () => {
    emit("select", props.group.id);
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

.group-members,
.group-total,
.group-code {
    margin: 0.3125rem 0;
    font-size: 0.875rem;
    color: #444;
}
</style>
