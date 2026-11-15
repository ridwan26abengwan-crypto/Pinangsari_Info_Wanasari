import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

export function GenderPieChart({ lakiLaki, perempuan }: { lakiLaki: number; perempuan: number }) {
  const { darkMode } = useApp();
  const textColor = darkMode ? '#e2e8f0' : '#334155';

  return (
    <div className="h-[260px] w-full flex items-center justify-center">
      <Pie
        data={{
          labels: ['Laki-laki', 'Perempuan'],
          datasets: [
            {
              data: [lakiLaki, perempuan],
              backgroundColor: ['#14532d', '#d97706'],
              borderColor: darkMode ? '#0f172a' : '#ffffff',
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, boxWidth: 12, padding: 16 },
            },
          },
        }}
      />
    </div>
  );
}

export function DistributionBarChart({
  dataMap,
  label,
  barColor = '#15803d',
}: {
  dataMap: Record<string, number>;
  label: string;
  barColor?: string;
}) {
  const { darkMode } = useApp();
  const textColor = darkMode ? '#cbd5e1' : '#475569';
  const gridColor = darkMode ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)';

  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);

  return (
    <div className="h-[280px] w-full">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: barColor,
              borderRadius: 6,
              maxBarThickness: 40,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: textColor, font: { size: 11 } },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { color: textColor, precision: 0 },
              grid: { color: gridColor },
            },
          },
        }}
      />
    </div>
  );
}

export function ServiceTrendLineChart({
  items,
  label = 'Jumlah Pengajuan Pelayanan',
}: {
  items: Array<{ bulan: string; total: number }>;
  label?: string;
}) {
  const { darkMode } = useApp();
  const textColor = darkMode ? '#cbd5e1' : '#475569';
  const gridColor = darkMode ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)';

  const safeItems = items.length > 0 ? items : [{ bulan: new Date().toISOString().slice(0, 7), total: 0 }];

  return (
    <div className="h-[260px] w-full">
      <Line
        data={{
          labels: safeItems.map((i) => i.bulan),
          datasets: [
            {
              label,
              data: safeItems.map((i) => i.total),
              borderColor: '#14532d',
              backgroundColor: 'rgba(20, 83, 45, 0.14)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: '#d97706',
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { left: 8, right: 16, top: 10 },
          },
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              offset: true,
              ticks: { color: textColor },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              suggestedMax: 3,
              ticks: { color: textColor, precision: 0 },
              grid: { color: gridColor },
            },
          },
        }}
      />
    </div>
  );
}
