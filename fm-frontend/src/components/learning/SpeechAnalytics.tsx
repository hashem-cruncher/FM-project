import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SpeechService } from '@/lib/services/speech-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp,
    BarChart,
    Clock,
    Award,
    Loader,
    Activity,
    Trophy,
    Box,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SpeechAnalyticsProps {
    userId: number;
    storyId?: string;
}

interface SpeechStats {
    total_activities: number;
    average_accuracy: number;
    highest_accuracy: number;
    improvement_trend: number;
    most_recent_accuracy: number;
}

interface SpeechHistoryItem {
    id: number;
    story_id: string;
    accuracy: number;
    created_at: string;
    original_text: string;
    recognized_text: string;
}

export function SpeechAnalytics({ userId, storyId }: SpeechAnalyticsProps) {
    const [stats, setStats] = useState<SpeechStats>({
        total_activities: 0,
        average_accuracy: 0,
        highest_accuracy: 0,
        improvement_trend: 0,
        most_recent_accuracy: 0
    });
    const [history, setHistory] = useState<SpeechHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const speechService = new SpeechService();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Get stats
                const statsData = await speechService.getSpeechStats(userId, storyId);
                setStats(statsData);

                // Get history
                const historyData = await speechService.getSpeechHistory(userId, storyId);
                setHistory(historyData);
            } catch (error) {
                console.error('Error loading speech analytics data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            loadData();
        }
    }, [userId, storyId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Graph data for activities
    const getGraphData = () => {
        // Last 10 activities, sorted by date
        const last10 = [...history]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-10);

        return last10;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overview card */}
                <Card className="p-6 font-arabic">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        <span>ملخص الأداء</span>
                    </h3>

                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : stats.total_activities === 0 ? (
                        <div className="h-40 flex items-center justify-center text-center">
                            <div className="space-y-2">
                                <Box className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <p className="text-muted-foreground">لا توجد بيانات للتحليل بعد. جرب قراءة النص وسيتم عرض إحصائياتك هنا.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">متوسط الدقة</span>
                                    <Badge
                                        variant="outline"
                                        className={`
                      ${stats.average_accuracy >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                                stats.average_accuracy >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'}
                    `}
                                    >
                                        {stats.average_accuracy}%
                                    </Badge>
                                </div>
                                <Progress value={stats.average_accuracy} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/10 p-3 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-sm">أعلى دقة</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Trophy className="h-4 w-4 text-amber-500" />
                                            <span className="text-xl font-semibold">{stats.highest_accuracy}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/10 p-3 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-sm">آخر تمرين</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="text-xl font-semibold">{stats.most_recent_accuracy}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/10 p-3 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-sm">تحسن الأداء</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <TrendingUp className={`h-4 w-4 ${stats.improvement_trend > 0 ? 'text-green-500' : stats.improvement_trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                                            <span className={`text-xl font-semibold ${stats.improvement_trend > 0 ? 'text-green-600' : stats.improvement_trend < 0 ? 'text-red-600' : ''}`}>
                                                {stats.improvement_trend > 0 ? '+' : ''}{stats.improvement_trend}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/10 p-3 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-sm">عدد التمارين</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <BarChart className="h-4 w-4 text-indigo-500" />
                                            <span className="text-xl font-semibold">{stats.total_activities}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Progress graph */}
                <Card className="p-6 font-arabic">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span>تقدم القراءة</span>
                    </h3>

                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-center">
                            <div className="space-y-2">
                                <Box className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <p className="text-muted-foreground">لا توجد بيانات للتحليل بعد. جرب قراءة النص وسيتم عرض تقدمك هنا.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 relative">
                            {getGraphData().map((item, index) => {
                                const graphData = getGraphData();
                                const height = (item.accuracy / 100) * 100;

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className={`absolute bottom-0 w-[8%] rounded-t-md ${item.accuracy >= 80 ? 'bg-green-500' :
                                            item.accuracy >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{
                                            left: `${(index / (graphData.length - 1)) * 92}%`,
                                        }}
                                    >
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
                                            {Math.round(item.accuracy)}%
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* X axis */}
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-muted-foreground/20" />
                        </div>
                    )}
                </Card>
            </div>

            {/* History */}
            {history.length > 0 && (
                <Card className="p-6 font-arabic">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>سجل التمارين</span>
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2">التوقيت</th>
                                    <th className="pb-2">الدقة</th>
                                    <th className="pb-2 hidden md:table-cell">القصة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.slice(0, 5).map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/5">
                                        <td className="py-3">{formatDate(item.created_at)}</td>
                                        <td className="py-3">
                                            <Badge
                                                variant="outline"
                                                className={`
                          ${item.accuracy >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                                        item.accuracy >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-red-50 text-red-700 border-red-200'}
                        `}
                                            >
                                                {Math.round(item.accuracy)}%
                                            </Badge>
                                        </td>
                                        <td className="py-3 hidden md:table-cell">
                                            {/* Get story title from ID */}
                                            {item.story_id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {history.length > 5 && (
                        <div className="mt-4 text-center">
                            <Button variant="outline" size="sm">
                                عرض المزيد
                            </Button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
} 