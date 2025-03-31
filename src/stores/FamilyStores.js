import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, db } from "@/firebase";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";

export const useFamilyStore = defineStore("familyStore", () => {
  const groups = ref([]);
  let unsubscribe = null;
  const isListening = ref(false);
  const initialLoadComplete = ref(false);

  const listenToUserGroups = () => {
    const user = auth.currentUser;
    if (!user) return;
    // Prevent multiple subscriptions.
    if (unsubscribe) return;

    const userGroupsRef = collection(db, "Users", user.uid, "Groups");
    unsubscribe = onSnapshot(userGroupsRef, async (snapshot) => {
      const updatedGroups = [];
      for (const groupDocSnap of snapshot.docs) {
        const groupId = groupDocSnap.id;
        const groupDoc = await getDoc(doc(db, "Groups", groupId));
        if (groupDoc.exists()) {
          updatedGroups.push({ id: groupId, ...groupDoc.data() });
        }
      }
      groups.value = updatedGroups;
      initialLoadComplete.value = true; // Signal that data has been loaded (even if empty)
    });
    isListening.value = true;
  };

  // Optionally, you can provide a method to stop listening.
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      isListening.value = false;
    }
  };

  return { groups, listenToUserGroups, stopListening, isListening, initialLoadComplete };
});
