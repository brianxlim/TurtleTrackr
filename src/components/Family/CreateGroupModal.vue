<template>
    <div class="modal">
        <div class="modal-content">
            <span class="close" @click="emitClose">&times;</span>
            <div class="modal-scroll-container">
                <div class="mascot-wrap">
                    <img src="/images/turtle_wave.gif" alt="Turtle Wave" class="turtle-mascot" />
                    <div class="speech-bubble">Hi pookie! Ready to create a fam?</div>
                </div>
                <h2>Create Group</h2>
                <input v-model="newGroupName" placeholder="Enter group name" class="input-field" />

                <!-- File upload input for group image -->
                <div class="upload-container">
                    <label for="groupImage">Upload Group Image (optional):</label>
                    <input type="file" id="groupImage" @change="handleFileUpload" accept="image/*" />
                    <div class="image-preview" v-if="imageURL">
                        <img :src="imageURL" alt="Group image preview" class="preview-img" />
                        <button @click="removeImage" class="remove-img-btn">Remove</button>
                    </div>
                </div>

                <!-- Group color selection - always visible -->
                <div>
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
                </div>

                <button @click="createGroup" class="btn submit-btn" :disabled="loading">
                    <span v-if="loading">Creating...</span>
                    <span v-else>Create</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { db, auth, storage } from '@/firebase';
import { addDoc, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// For image upload state
const imageFile = ref(null);
const imageURL = ref("");

const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    imageFile.value = file;

    // Create a unique path for the file (e.g., using current timestamp and file name)
    const storageReference = storageRef(storage, `groupImages/${Date.now()}_${file.name}`);
    try {
        const snapshot = await uploadBytes(storageReference, file);
        imageURL.value = await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("There was an error uploading the image. Please try again.");
    }
};

const removeImage = () => {
    imageURL.value = "";
    imageFile.value = null;
    // Reset the file input by creating a new one
    const fileInput = document.getElementById("groupImage");
    if (fileInput) {
        fileInput.value = "";
    }
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
        image: imageURL.value, // This can be empty if no image was uploaded
        color: selectedColor.value, // Always include the color
        members: [user.uid],
        totalSpent: 0,
        inviteCode: groupCode,
        hasImage: !!imageURL.value, // Boolean flag to indicate if an image is present
        createdBy: user.uid,
        createdAt: new Date()
    };

    try {
        // Create group in main Groups collection.
        const groupDocRef = await addDoc(collection(db, "Groups"), newGroup);
        const groupId = groupDocRef.id;

        // Close the modal immediately after creating the group.
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
    imageFile.value = null;
    imageURL.value = "";
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
    overflow: hidden;
}

.modal-content {
    background-color: #fffaf0;
    border-radius: 1.25rem;
    width: 90%;
    max-width: 25rem;
    max-height: 90vh; /* Limit height to 90% of viewport height */
    box-shadow: 0 0.75rem 1.875rem rgba(0, 0, 0, 0.15);
    position: relative;
    animation: slideIn 0.4s ease-out;
    display: flex;
    flex-direction: column;
}

.modal-scroll-container {
    padding: 2rem;
    overflow-y: auto;
    max-height: calc(90vh - 2rem); /* Allow scrolling within container */
    scrollbar-width: thin;
    scrollbar-color: #aaa transparent;
}

/* Custom scrollbar styles for Webkit browsers */
.modal-scroll-container::-webkit-scrollbar {
    width: 6px;
}
.modal-scroll-container::-webkit-scrollbar-track {
    background: transparent;
}
.modal-scroll-container::-webkit-scrollbar-thumb {
    background-color: #aaa;
    border-radius: 6px;
}

.close {
    position: absolute;
    top: 0.75rem;
    right: 1.125rem;
    font-size: 1.75rem;
    cursor: pointer;
    color: #aaa;
    z-index: 10;
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
    width: 5rem; /* Smaller mascot */
    max-height: 6rem;
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
    margin-bottom: 1rem;
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

.upload-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    margin: 0.75rem 0;
}

.color-label {
    display: block;
    margin-top: 0.75rem;
    font-size: 1rem;
}

.color-swatch-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.625rem;
    margin: 0.5rem 0 1rem;
}

.color-swatch {
    width: 1.5rem; /* Smaller color swatches */
    height: 1.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s ease, border 0.2s ease;
}

.color-swatch:hover {
    transform: scale(1.1);
}

.image-preview {
    margin-top: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    overflow: hidden;
    max-width: 100%;
    position: relative;
}

.preview-img {
    width: 100%;
    max-height: 6rem; /* Smaller preview image */
    object-fit: cover;
}

.remove-img-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
}

.remove-img-btn:hover {
    background: rgba(255, 255, 255, 0.9);
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
    width: 100%;
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