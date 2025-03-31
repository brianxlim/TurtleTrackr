<template>
    <div class="modal">
        <div class="modal-content">
            <span class="close" @click="emitClose">&times;</span>
            <div class="mascot-wrap">
                <img src="/images/turtle_wave.gif" alt="Turtle Wave" class="turtle-mascot" />
                <div class="speech-bubble">Hi pookie! Ready to create a fam?</div>
            </div>
            <h2>Create Group</h2>
            <input v-model="newGroupName" placeholder="Enter group name" class="input-field" />

            <label class="color-label">Choose Group Color:</label>
            <div class="color-swatch-container">
                <div
                    v-for="color in presetColors"
                    :key="color"
                    class="color-swatch"
                    :style="{
                    backgroundColor: color,
                    border: selectedColor === color ? '0.1875rem solid #444' : '0.125rem solid transparent'
                    }"
                    @click="selectedColor = color"
                ></div>
            </div>

            <button @click="createGroup" class="btn submit-btn" :disabled="loading">
            <span v-if="loading">Creating...</span>
            <span v-else>Create</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { db, auth } from '@/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const emit = defineEmits(['groupCreated', 'close']);

const newGroupName = ref("");
const selectedColor = ref("#C0C0C0");
const presetColors = ref([
    "#F7B267", "#F4845F", "#8AC6D1", "#A1C298",
    "#D5AAFF", "#FFA5AB", "#FFCB77", "#B5EAEA",
    "#B084CC", "#C0C0C0"
]);
const loading = ref(false);

const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const createGroup = async () => {
    if (!newGroupName.value.trim()) {
        alert("Please enter a group name");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to create a group.");
        return;
    }

    loading.value = true;
    const groupCode = generateGroupCode();
    const newGroup = {
        name: newGroupName.value,
        image: "/images/default.png",
        members: [user.uid],
        totalSpent: 0,
        inviteCode: groupCode,
        color: selectedColor.value || "#C0C0C0",
        createdBy: user.uid,
        createdAt: new Date()
    };

    try {
    // Create group in main groups collection.
    const groupDocRef = await addDoc(collection(db, "Groups"), newGroup);
    const groupId = groupDocRef.id;

    // Immediately close the modal.
    emit("close");

    // Add a reference to the group in the user's subcollection "Groups".
    await setDoc(doc(db, "Users", user.uid, "Groups", groupId), {
        name: newGroup.name,
        inviteCode: newGroup.inviteCode,
        joinedAt: new Date()
    });

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
    emit("groupCreated");
    } catch (err) {
    console.error("Error creating group:", err);
    alert("Error creating group. Please try again.");
    }

    newGroupName.value = "";
    selectedColor.value = "#C0C0C0";
    loading.value = false;
};

const emitClose = () => {
    emit("close");
};
</script>

<style scoped>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    animation: fadeIn 0.3s ease-out;
}

.modal-content {
    background-color: #fffaf0;
    border-radius: 1.25rem;
    padding: 2rem;
    width: 90%;
    max-width: 25rem;
    text-align: center;
    box-shadow: 0 0.75rem 1.875rem rgba(0, 0, 0, 0.15);
    position: relative;
    animation: slideIn 0.4s ease-out;
}

.close {
    position: absolute;
    top: 0.75rem;
    right: 1.125rem;
    font-size: 1.75rem;
    cursor: pointer;
    color: #aaa;
}

.close:hover {
    color: #333;
}

.mascot-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
}

.turtle-mascot {
    width: 6.25rem;
    max-height: 7.5rem;
    object-fit: contain;
    margin-bottom: 0.5rem;
    animation: floatWave 2s ease-in-out infinite;
}

.speech-bubble {
    background: #fff;
    border-radius: 0.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: #333;
    box-shadow: 0 0.25rem 0.625rem rgba(0, 0, 0, 0.2);
    margin-top: 0.5rem;
}

.modal-content h2 {
    margin-bottom: 1.25rem;
    font-size: 1.5rem;
    color: #333;
}

.input-field {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    border: 0.09375rem solid #ccc;
    margin-bottom: 0.9375rem;
    box-sizing: border-box;
    font-family: var(--font-body);
}

.color-label {
    display: block;
    margin-top: 0.9375rem;
    font-size: 1rem;
}

.color-swatch-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.625rem;
    margin: 0.625rem 0 1.25rem;
}

.color-swatch {
    width: 1.875rem;
    height: 1.875rem;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s ease, border 0.2s ease;
}

.color-swatch:hover {
    transform: scale(1.1);
}

.btn.submit-btn {
    background-color: #627ea4;
    color: white;
    font-weight: bold;
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 0.625rem;
}

.btn.submit-btn:disabled {
    background-color: #999;
    cursor: not-allowed;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from {
    transform: translateY(-1.875rem);
    opacity: 0;
    }
    to {
    transform: translateY(0);
    opacity: 1;
    }
}

@keyframes floatWave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-0.3125rem); }
}
</style>
