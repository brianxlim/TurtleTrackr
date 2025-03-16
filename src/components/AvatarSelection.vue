<template>
    <div class="avatar-selection">
        <div class="avatars">
            <div
                v-for="turtle in turtles"
                :key="turtle.turtleFilename"
                :class="['avatar-item', { selected: selectedTurtle && selectedTurtle.turtleFilename === turtle.turtleFilename }]"
                @click="selectAvatar(turtle)"
            >
                <img :src="getAvatarURL(turtle.turtleFilename)" :alt="turtle.turtleName" />
                <p>{{ turtle.turtleName }}</p>
            </div>
        </div>
    </div>
</template>
  
<script setup>
import { ref } from "vue";
import turtles from "@/assets/turtles.json";
import { getAvatarURL } from "@/firebase";

// Event listeners @selected-turtle will trigger when this value changes
const emit = defineEmits(["selected-turtle"]);

// Used to trigger CSS
const selectedTurtle = ref(null);

// Called when the user selects an avatar.
const selectAvatar = async (turtle) => {
    selectedTurtle.value = turtle;
    emit("selected-turtle", turtle);
};
</script>
    
<style scoped>
.avatars {
    display: grid;
    grid-template-columns: repeat(4, auto);
    gap: 2rem;
    justify-content: start;
}

/* Responsiveness to mobile */
@media (max-width: 1000px) {
    .avatars {
        grid-template-columns: repeat(2, auto);
    }
}

.avatar-item {
    cursor: pointer;
    text-align: center;
    padding: 0.8rem;
    transition: transform 0.3s ease-in-out, border-color 0.3s ease-in-out;
}

.avatar-item:hover {
    transform: scale(1.05);
}

.avatar-item.selected {
    border: 2px solid var(--color-main-dark);
    border-radius: 8px;
}

.avatar-item img {
    width: 6rem;
    height: 4rem;
}

p {
    margin: 0;
}
</style>
  