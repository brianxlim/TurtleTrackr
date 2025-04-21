<template>
  <div class="inbox-popup">
    <div class="inbox-header">
      <h3>Inbox</h3>
      <button class="close-btn" @click="$emit('close')">✖</button>
    </div>
    
    <div class="messages-container">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-inbox">
        <p>No messages</p>
      </div>
      
      <template v-else>
        <div 
          v-for="message in messages" 
          :key="message.id" 
          class="message-card"
          :class="{ 'unread': !message.read }"
          @click="markAsRead(message)">
          
          <div class="message-header">
            <div class="user-info">
              <span class="user-name">{{ message.user }}</span>
              <span class="category-tag">{{ message.category }}</span>
            </div>
            <div v-if="!message.read" class="unread-dot"></div>
          </div>
          
          <div class="message-content">
            <p v-if="message.type === 'limit-exceeded'">
              Exceeded budget limit of ${{ message.limit.toFixed(2) }} for {{ message.monthText }}
            </p>
            <p v-else-if="message.type === 'limit-changed'">
              Changed budget from ${{ message.originalLimit.toFixed(2) }} to ${{ message.newLimit.toFixed(2) }}
            </p>
            <p v-else>
              {{ message.type }} notification
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    markAsRead(message) {
      if (!message.read) {
        this.$emit('mark-read', message);
      }
    }
  }
}
</script>

<style scoped>
.inbox-popup {
  position: fixed;
  top: 10%;
  right: 10%;
  width: 350px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.inbox-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.messages-container {
  padding: 12px;
  overflow-y: auto;
  flex-grow: 1;
  min-height: 150px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.empty-inbox {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #999;
}

.message-card {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.message-card:hover {
  background: #f0f0f0;
}

.message-card.unread {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  font-weight: bold;
  margin-right: 8px;
}

.category-tag {
  background: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background-color: #ff4d4f;
  border-radius: 50%;
}

.message-content {
  font-size: 14px;
  color: #333;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>