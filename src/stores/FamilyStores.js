import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, db } from "@/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";

export const useFamilyStore = defineStore("familyStore", () => {
  const groups = ref([]);
  let userGroupsUnsubscribe = null;
  let groupsUnsubscribe = null;
  const isListening = ref(false);
  const initialLoadComplete = ref(false);

  // This method sets up listeners for both the user's Groups subcollection
  // and the main Groups collection where the user is a member
  const listenToUserGroups = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Clean up any existing listeners first
    stopListening();
    
    // First, listen to the user's Groups subcollection
    const userGroupsRef = collection(db, "Users", user.uid, "Groups");
    userGroupsUnsubscribe = onSnapshot(userGroupsRef, async (snapshot) => {
      // Get the IDs of all groups the user is registered to
      const userGroupIds = snapshot.docs.map(doc => doc.id);
      const fetchedGroups = [];
      
      // Fetch the full group data for each ID
      for (const groupId of userGroupIds) {
        const groupDoc = await getDoc(doc(db, "Groups", groupId));
        
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          
          // Check if the user is actually still in the group's members array
          if (groupData.members && groupData.members.includes(user.uid)) {
            fetchedGroups.push({ id: groupId, ...groupData });
          } else {
            // If the user is no longer in the group members array, clean up the user's Groups subcollection
            console.log(`User is not in group ${groupId} members array - cleaning up reference`);
            try {
              await deleteDoc(doc(db, "Users", user.uid, "Groups", groupId));
            } catch (error) {
              console.error("Error cleaning up group reference:", error);
            }
          }
        } else {
          // If the group doesn't exist anymore, clean up the user's Groups subcollection
          console.log(`Group ${groupId} doesn't exist - cleaning up reference`);
          try {
            await deleteDoc(doc(db, "Users", user.uid, "Groups", groupId));
          } catch (error) {
            console.error("Error cleaning up group reference:", error);
          }
        }
      }
      
      // Also listen to Groups collection where the user is a member
      // This helps us catch any groups where the user might have been added directly
      const groupsRef = collection(db, "Groups");
      const groupsQuery = query(groupsRef, where("members", "array-contains", user.uid));
      
      groupsUnsubscribe = onSnapshot(groupsQuery, (groupsSnapshot) => {
        const groupsFromQuery = [];
        
        groupsSnapshot.forEach(doc => {
          groupsFromQuery.push({ id: doc.id, ...doc.data() });
        });
        
        // Combine and deduplicate groups from both sources
        const allGroups = [...fetchedGroups];
        
        // Add groups from the query that aren't already in the list
        for (const group of groupsFromQuery) {
          if (!allGroups.some(g => g.id === group.id)) {
            allGroups.push(group);
          }
        }
        
        // Update the store
        groups.value = allGroups;
        initialLoadComplete.value = true;
      });
    });
    
    isListening.value = true;
  };

  // Stop all listeners
  const stopListening = () => {
    if (userGroupsUnsubscribe) {
      userGroupsUnsubscribe();
      userGroupsUnsubscribe = null;
    }
    
    if (groupsUnsubscribe) {
      groupsUnsubscribe();
      groupsUnsubscribe = null;
    }
    
    isListening.value = false;
  };

  return { 
    groups, 
    listenToUserGroups, 
    stopListening, 
    isListening, 
    initialLoadComplete 
  };
});