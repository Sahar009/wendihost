import Card from '@/components/dashboard/Card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dataPoints = [78, 62, 80, 28, 42, 50, 30, 70, 55, 50, 35, 100];

interface ServiceMetricsProps {
  isMobile: boolean;
  monthlyClicks?: number[];
}

export default function ServiceMetrics({ isMobile, monthlyClicks }: ServiceMetricsProps) {
  const data = {
    labels: months,
    datasets: [
      {
        label: 'WhatsApp link clicks',
        data: monthlyClicks && monthlyClicks.length === 12 ? monthlyClicks : dataPoints,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: isMobile ? 1.5 : 2,
        pointRadius: isMobile ? 2 : 3,
        pointHoverRadius: isMobile ? 4 : 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 0,
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 12 : 14,
            weight: 'normal',
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: isMobile ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: isMobile ? 6 : 12,
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: function(this: any, value: string | number) {
            const numValue = Number(value);
            return numValue === 0 ? '0' : numValue === 100 ? '100' : '';
          },
          font: {
            size: isMobile ? 10 : 12,
          },
        },
        grid: {
          color: (context: any) => {
            return context.tick.value === 0 ? 'transparent' : '#E5E7EB';
          },
          lineWidth: 1,
          drawTicks: false,
          drawOnChartArea: true
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
      },
      point: {
        radius: isMobile ? 2 : 3,
        hoverRadius: isMobile ? 4 : 5,
      },
    },
  };

  return (
    <Card className="h-full">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold">WhatsApp link clicks (2025)</h3>
        </div>
        <div className="relative h-48 sm:h-64 md:h-72 lg:h-80 w-full">
          <Line 
            data={data}
            options={options}
          />
        </div>
      </div>
    </Card>
  );
}
