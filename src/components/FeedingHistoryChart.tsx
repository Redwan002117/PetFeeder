import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { format } from 'date-fns';

interface FeedingEvent {
  id: string;
  device_id: string;
  amount: number;
  type: string;
  timestamp: string;
}

interface FeedingHistoryChartProps {
  history: FeedingEvent[];
  loading?: boolean;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const feedingData = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border shadow-sm rounded-md text-sm">
        <p className="font-medium">{format(new Date(label), 'MMM d, yyyy HH:mm')}</p>
        <p className="text-pet-primary">{`Amount: ${feedingData.amount}g`}</p>
        <p className="capitalize">{`Type: ${feedingData.type}`}</p>
      </div>
    );
  }

  return null;
};

export const FeedingHistoryChart: React.FC<FeedingHistoryChartProps> = ({
  history,
  loading = false
}) => {
  // Process data for chart
  const chartData = history.map(event => ({
    timestamp: new Date(event.timestamp).getTime(),
    amount: event.amount,
    type: event.type,
    // Format date for display on X axis
    date: format(new Date(event.timestamp), 'MMM d, HH:mm')
  })).sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feeding History</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 10 }}
              />
              <YAxis unit="g" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                name="Amount" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No feeding history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedingHistoryChart;
