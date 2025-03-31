<template>
    <div class="modal">
        <div class="modal-content">
            <span class="close" @click="$emit('close')">&times;</span>
            <h2>Join Group</h2>
            <input v-model="joinGroupCode" placeholder="Enter group invite code" class="input-field" />
            <button @click="joinGroup" class="btn submit-btn" :disabled="loading">
            {{ loading ? "Joining..." : "Join" }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { db, auth } from '@/firebase';
import { query, collection, where, getDocs, updateDoc, arrayUnion, doc, setDoc, getDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const emit = defineEmits(["groupJoined", "close"]);

const joinGroupCode = ref("");
const loading = ref(false);

const joinGroup = async () => {
    if (!joinGroupCode.value.trim()) {
        alert("Please enter a group invite code.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to join a group.");
        return;
    }

    loading.value = true;

    try {
        const groupQuery = query(
            collection(db, "Groups"),
            where("inviteCode", "==", joinGroupCode.value.trim().toUpperCase())
        );
        const groupSnapshot = await getDocs(groupQuery);

        if (groupSnapshot.empty) {
            alert("Invalid invite code. Please try again.");
            loading.value = false;
            return;
        }

        const groupDoc = groupSnapshot.docs[0];
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();

        const userGroupRef = doc(db, "Users", user.uid, "Groups", groupId);
        const userGroupDoc = await getDoc(userGroupRef);
        if (userGroupDoc.exists()) {
            alert("You are already a member of this group.");
            loading.value = false;
            return;
        }

        await updateDoc(groupDoc.ref, {
            members: arrayUnion(user.uid)
        });

        await setDoc(userGroupRef, {
            name: groupData.name,
            inviteCode: groupData.inviteCode,
            joinedAt: new Date()
        });

        confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.7 },
        });
    } catch (err) {
        console.error("Error joining group:", err);
        alert("Error joining group. Please try again.");
    }

    joinGroupCode.value = "";
    loading.value = false;

    // Emit events to notify the parent component.
    emit("groupJoined");
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
    padding: 1.875rem 1.5625rem;
    width: 90%;
    max-width: 25rem;
    text-align: center;
    box-shadow: 0 0.75rem 1.875rem rgba(0, 0, 0, 0.15);
    position: relative;
    animation: slideIn 0.4s ease-out;
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

.submit-btn {
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

.submit-btn:disabled {
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
</style>
