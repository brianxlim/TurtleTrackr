// src/stores/familyStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, db } from "@/firebase";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";

export const useFamilyStore = defineStore("familyStore", () => {
  const groups = ref([]);
  let unsubscribe = null;
  const isListening = ref(false);

  const listenToUserGroups = () => {
    // If we already have a subscription, do nothing.
    if (isListening.value) return;
    const user = auth.currentUser;
    if (!user) return;

    // Use the user's subcollection "Groups" (case-sensitive)
    const userGroupsRef = collection(db, "Users", user.uid, "Groups");
    unsubscribe = onSnapshot(userGroupsRef, async (snapshot) => {
      const updatedGroups = [];
      // For each group document reference in the user's subcollection,
      // load the full group data from the main "Groups" collection.
      for (const groupDocSnap of snapshot.docs) {
        const groupId = groupDocSnap.id;
        const groupDoc = await getDoc(doc(db, "Groups", groupId));
        if (groupDoc.exists()) {
          updatedGroups.push({ id: groupId, ...groupDoc.data() });
        }
      }
      groups.value = updatedGroups;
    });
    isListening.value = true;
  };

  // Optionally, you could provide a stopListening method (for example, when a user logs out)
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      isListening.value = false;
    }
  };

  return { groups, listenToUserGroups, stopListening, isListening };
});
