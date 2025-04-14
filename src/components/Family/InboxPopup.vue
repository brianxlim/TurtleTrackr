<template>
    <div class="inbox-popup">
      <div class="popup-header">
        <h2>Inbox</h2>
        <span class="close-btn" @click="$emit('close')">×</span>
      </div>
  
      <div class="popup-body">
        <template v-if="messages.length">
          <div v-for="(msg, index) in messages" :key="index" class="message-card">
            <div class="message-content">
              <div class="top-row">
                <span class="username">{{ msg.user }}</span>
                <span class="timestamp">{{ msg.timestamp || 'Just now' }}</span>
              </div>
              <p class="message-text">
                <template v-if="msg.type === 'limit-exceeded'">
                  <span class="keyword">Exceeded</span> {{ msg.category.toLowerCase() }} limit of
                  <strong>${{ msg.limit }}</strong> for {{ msg.monthText }}.
                </template>
                <template v-else-if="msg.type === 'limit-updated'">
                  {{ msg.user }} has changed {{ msg.category }} limit from
                  <strong>${{ msg.originalLimit }}</strong> to
                  <strong>${{ msg.newLimit }}</strong> for {{ msg.monthText }}.
                </template>
              </p>
            </div>
          </div>
        </template>
  
        <template v-else>
          <p class="no-alerts">No spending alerts yet 🎉</p>
        </template>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    messages: {
      type: Array,
      default: () => [],
    },
  });
  </script>
  
  <style scoped>
  .inbox-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--color-secondary-dark);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    width: 480px;
    max-width: 95%;
    z-index: 999;
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.6rem;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .close-btn {
    font-size: 1.2rem;
    cursor: pointer;
  }
  
  .popup-body {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .message-card {
    background-color: #f9f9f9;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }
  
  .message-content {
    flex: 1;
  }
  
  .top-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.3rem;
  }
  
  .username {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .timestamp {
    font-size: 0.85rem;
    color: #888;
  }
  
  .message-text {
    font-size: 0.95rem;
    line-height: 1.4;
    color: #333;
  }
  
  .keyword {
    color: #d9534f;
    font-weight: 600;
  }
  
  .no-alerts {
    text-align: center;
    font-size: 1rem;
    color: #666;
    padding: 2rem 0;
  }
  </style>
  