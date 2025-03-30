<template>
    <div class="header">
        <h1>My Families</h1>
        <div class="buttons">
            <button @click="$emit('openCreate')" class="btn create-btn">Create Group</button>
            <button @click="$emit('openJoin')" class="btn join-btn">Join Group</button>
        </div>
    </div>
</template>

<style scoped>
h1 {
    font-size: 1.5rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #3e533f;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.875rem;
    color: white;
}

.buttons {
    display: flex;
    gap: 0.625rem;
}

.btn {
    font-family: 'Poppins';
    padding: 0.625rem 1.125rem;
    font-size: 1rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
}

.create-btn {
    background-color: #627ea4;
    color: white;
}

.join-btn {
    background-color: #a9c4ea;
    color: white;
}
</style>
