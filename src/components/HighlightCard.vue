<template>
    <div class="highlight-card">
      <div class="user-info">
        <div class="username">
          <i v-if="loadingName" class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
          <span v-else>{{ displayName }}</span>
        </div>
        <div class="time">{{ formattedDate }}</div>
      </div>
  
      <div class="highlight-content">
        <p class="highlight-text">
          <span class="spent-text">Spent</span>
          ${{ amount.toFixed(0) }} on {{ title }}.
        </p>
      </div>
  
      <div class="reaction-counters">
        <div class="like-counter">
          <span class="thumb-icon" @click="like">👍</span>
          <span class="count">{{ likedBy.length }}</span>
        </div>
        <div class="dislike-counter">
          <span class="thumb-icon" @click="dislike">👎</span>
          <span class="count">{{ dislikedBy.length }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { getDoc, doc } from 'firebase/firestore';
  import { db, auth } from '@/firebase';
  
  // Props from parent
  const props = defineProps({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    userId: { type: String, required: true },
    date: { type: String, required: true },
    likedBy: { type: Array, default: () => [] },
    dislikedBy: { type: Array, default: () => [] },
    groupId: { type: String, required: true },
    postId: { type: String, required: true }
  });
  
  // Emit events for like/dislike
  const emit = defineEmits(['like', 'dislike']);
  
  // Display name and loading state
  const displayName = ref('');
  const loadingName = ref(true);
  
  // Fetch displayName from Firestore
  onMounted(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'Users', props.userId));
      if (userDoc.exists()) {
        displayName.value = userDoc.data().displayName;
      } else {
        displayName.value = 'Unknown User';
      }
    } catch (err) {
      console.error('Error fetching user displayName:', err);
      displayName.value = 'Unknown User';
    } finally {
      loadingName.value = false;
    }
  });
  
  // Computed: formatted date
  const formattedDate = computed(() => {
    const d = new Date(props.date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  });
  
  // Computed: whether current user has liked/disliked
  const isLiked = computed(() => auth.currentUser && props.likedBy.includes(auth.currentUser.uid));
  const isDisliked = computed(() => auth.currentUser && props.dislikedBy.includes(auth.currentUser.uid));
  
  // Handlers guard by auth
  function like() {
    if (!auth.currentUser) {
      alert('You need to be logged in to like posts');
      return;
    }
    emit('like', props.postId);
  }
  
  function dislike() {
    if (!auth.currentUser) {
      alert('You need to be logged in to dislike posts');
      return;
    }
    emit('dislike', props.postId);
  }
  </script>
  
  <style scoped>
  .highlight-card {
    display: flex;
    padding: 1rem 1.5rem;
    background: #ccdbcb;
    border-radius: 1rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-right: 1rem;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f0f0f0;
    margin-bottom: 0.5rem;
  }
  
  .username {
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .time {
    font-size: 14px;
    color: #666;
  }
  
  .highlight-content {
    flex: 1;
  }
  
  .highlight-text {
    margin: 0;
  }
  
  .spent-text {
    color: #f97316;
    font-weight: 500;
  }
  
  .reaction-counters {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .like-counter,
  .dislike-counter {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .thumb-icon {
    cursor: pointer;
    font-size: 18px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .thumb-icon:hover {
    opacity: 1;
  }
  
  .count {
    font-size: 14px;
    font-weight: 500;
  }
  </style>
  