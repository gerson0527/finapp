import AsyncStorage from '@react-native-async-storage/async-storage';

function reviewKey(userId: string, month: string): string {
  return `finapp_budget_review_v1_${userId}_${month}`;
}

export async function hasReviewedBudgetMonth(userId: string, month: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(reviewKey(userId, month));
  return value === '1';
}

export async function markBudgetMonthReviewed(userId: string, month: string): Promise<void> {
  await AsyncStorage.setItem(reviewKey(userId, month), '1');
}
