import type { Metadata } from 'next';
import LearningRewards from '@/modules/common/LearningRewards';
export const metadata: Metadata = { title: 'Learning reward plan', description: 'A local parent-reviewed plan for future Geek Jr learning rewards. No token payments are active.' };
export default function LearningRewardsPage() { return <LearningRewards />; }
