// charts/InvoiceStatsChart.jsx
import { PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Paid', value: 500 },
  { name: 'Pending', value: 300 },
];
const COLORS = ['#00C49F', '#FF8042'];

const InvoiceStatsChart = () => (
  <PieChart width={250} height={250}>
    <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value">
      {data.map((entry, idx) => (
        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
      ))}
    </PieChart>
  );
};
