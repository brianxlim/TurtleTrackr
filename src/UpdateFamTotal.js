import { db } from '@/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function updateGroupTotals(groupId, memberUIDs, selectedMonth) {
  let total = 0;

  for (const uid of memberUIDs) {
    const expensesRef = collection(db, 'Users', uid, 'Expenses');
    const snap = await getDocs(expensesRef);

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const date = new Date(data.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthKey === selectedMonth) {
        total += parseFloat(data.Amount || 0);
      }
    });
  }

  await updateDoc(doc(db, "Groups", groupId), { totalSpent: total });
}
