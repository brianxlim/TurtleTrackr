<template>
    <div class="highlight-card">
        <div class="highlight-top">
            <div class="user-info">
                <div class="user-details">
                    <div class="username">{{ userName }}</div>
                    <div class="time">{{ formattedDate }}</div>
                </div>
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

        <div class="highlight-content">
            <p class="highlight-text">
                Has <span class="spent-text">spent</span> ${{ amount.toFixed(0) }} on {{ title }}.
            </p>
        </div>
    </div>
</template>
  
<script>
import { auth } from '@/firebase';

export default {
    props: {
        title: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        date: {
            type: String,
            required: true
        },
        likedBy: {
            type: Array,
            default: () => []
        },
        dislikedBy: {
            type: Array,
            default: () => []
        },
        groupId: {
            type: String,
            required: true
        },
        postId: {
            type: String,
            required: true
        }
    },
    computed: {
        isLiked() {
            return auth.currentUser && this.likedBy.includes(auth.currentUser.uid);
        },
        isDisliked() {
            return auth.currentUser && this.dislikedBy.includes(auth.currentUser.uid);
        },
        formattedDate() {
            const postDate = new Date(this.date);
            // Format: MM/DD/YYYY
            return `${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}`;
            
            // Alternative formats:
            // For DD/MM/YYYY: return `${postDate.getDate()}/${postDate.getMonth() + 1}/${postDate.getFullYear()}`;
            // For YYYY-MM-DD: return postDate.toISOString().split('T')[0];
        }
    },
    methods: {
        like() {
            if (!auth.currentUser) {
                alert('You need to be logged in to like posts');
                return;
            }
            this.$emit('like', this.postId);
        },
        dislike() {
            if (!auth.currentUser) {
                alert('You need to be logged in to dislike posts');
                return;
            }
            this.$emit('dislike', this.postId);
        }
    }
};
</script>
  
<style scoped>
.highlight-card {
    background: #ccdbcb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}

.highlight-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f0f0f0;
}

.user-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: bold;
    font-size: 16px;
}

.time {
    font-size: 14px;
    color: #666;
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

.highlight-content {
    padding: 4px 0;
}

.highlight-text {
    font-size: 16px;
    margin: -20px;
}

.spent-text {
    color: #f97316;
    font-weight: 500;
}
</style>