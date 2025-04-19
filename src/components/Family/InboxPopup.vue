<template>
    <div class="inbox-popup">
      <div class="inbox-header">
        <h3>Inbox</h3>
        <button @click="$emit('close')">×</button>
      </div>
      
      <div class="messages-container">
        <div v-if="messages.length === 0" class="empty-inbox">
          No messages
        </div>
        
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          class="message"
        >
          <div class="message-header">
            <span class="user">{{ message.user }}</span>
            <span class="date">{{ formatTimestamp(message.timestamp) }}</span>
          </div>
          
          <div class="message-content">
            <!-- Different message types -->
            <template v-if="message.type === 'limit-set'">
              Set a budget limit of ${{ message.limit }} for {{ message.category }} in {{ message.monthText }}
            </template>
            
            <template v-else-if="message.type === 'limit-updated'">
              Updated {{ message.category }} budget from ${{ message.originalLimit }} to ${{ message.newLimit }}
            </template>
            
            <template v-else-if="message.type === 'limit-exceeded'">
              <span class="warning">Exceeded</span> {{message.category}} limit of ${{ message.limit }} for {{ message.monthText }}.
            </template>
            
            <!-- Fallback for any other message type -->
            <template v-else>
              {{ message.type }} alert for {{ message.category }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      messages: {
        type: Array,
        required: true
      }
    },
    methods: {
      formatTimestamp(timestamp) {
        // If timestamp is missing, return empty string
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid date';
        
        // Format as "Apr 14, 2:30 PM"
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  }
  </script>
  
  <style scoped>
  .inbox-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    max-height: 80vh;
    background-color: var(--color-secondary-dark);
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .inbox-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: var(--color-secondary-dark);
    border-bottom: 1px solid #e0e0e0;
  }
  
  .inbox-header h3 {
    margin: 0;
    font-size: 20px;
  }
  
  .inbox-header button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0 5px;
  }
  
  .messages-container {
    padding: 15px;
    overflow-y: auto;
    flex: 1;
  }
  
  .empty-inbox {
    text-align: center;
    color: #888;
    padding: 20px;
  }
  
  .message {
    padding: 12px 15px;
    margin-bottom: 12px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border-left: 3px solid #ddd;
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  
  .user {
    font-weight: bold;
  }
  
  .date {
    color: #888;
    font-size: 0.9em;
  }
  
  .message-content {
    color: #333;
  }
  
  .warning {
    color: #e53935;
    font-weight: bold;
  }
  </style>