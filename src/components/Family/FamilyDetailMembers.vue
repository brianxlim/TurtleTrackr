<template>
    <div class="family-detail-members">
        <h2>Members:</h2>
        <div v-if="loading" class="loading-indicator">
            <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
        </div>
        <ul v-else>
            <li
                v-for="(displayName, uid) in memberDisplayNames"
                :key="uid"
                @click="goToMember(uid)"
            >
                {{ displayName }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/AuthStores';

const props = defineProps({
    members: {
        type: Array,
        default: () => []
    }
});

const authStore = useAuthStore();
const loading = ref(false);
const router = useRouter();
const memberDisplayNames = ref({});

const fetchMemberDisplayNames = async () => {
    loading.value = true;
    const displayMap = {};
    for (const uid of props.members) {
        try {
            const userDocSnap = await getDoc(doc(db, "Users", uid));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                displayMap[uid] = authStore.user.displayName === userData.displayName ? 
                    userData.displayName + " (You)" : 
                    userData.displayName || "NaN";
            } else {
                displayMap[uid] = "Unknown User";
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            displayMap[uid] = "Error Loading Name";
        }
    }
    memberDisplayNames.value = displayMap;
    loading.value = false;
};

onMounted(() => {
    if (props.members.length > 0) fetchMemberDisplayNames();
});

watch(() => props.members, (newMembers, oldMembers) => {
    if (newMembers !== oldMembers && newMembers.length > 0) {
        fetchMemberDisplayNames();
    }
});

const goToMember = (uid) => {
    router.push({ name: 'History', params: { uid } });
};
</script>

<style scoped>
ul {
    list-style: none;
    padding: 0;
}

li {
    cursor: pointer;
    padding: 0.5rem;
    border-bottom: 0.05rem solid #ccc;
    transition: background-color 0.2s ease;
}

li:hover {
    background-color: #f0f0f0;
}
</style>
