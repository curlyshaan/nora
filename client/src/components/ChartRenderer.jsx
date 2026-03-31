import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

// Parse chart data from markdown code blocks
export function parseChartData(code, type) {
  try {
    const data = JSON.parse(code);
    return data;
  } catch (e) {
    console.error('Failed to parse chart data:', e);
    return null;
  }
}

// Stock Price Chart
export function StockChart({ data, title }) {
  return (
    <div style={{ width: '100%', height: 400, marginTop: 20 }}>
      <h4 style={{ textAlign: 'center', marginBottom: 10 }}>{title || 'Stock Price'}</h4>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="price" stroke="#667eea" fillOpacity={1} fill="url(#colorPrice)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Volume Chart
export function VolumeChart({ data, title }) {
  return (
    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
      <h4 style={{ textAlign: 'center', marginBottom: 10 }}>{title || 'Volume'}</h4>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="volume" fill="#667eea" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Technical Indicator Chart (RSI, MACD, etc.)
export function IndicatorChart({ data, title, indicators }) {
  return (
    <div style={{ width: '100%', height: 350, marginTop: 20 }}>
      <h4 style={{ textAlign: 'center', marginBottom: 10 }}>{title || 'Technical Indicators'}</h4>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          {indicators?.map((indicator, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={indicator.key}
              stroke={indicator.color || '#667eea'}
              name={indicator.name}
              strokeWidth={2}
            />
          ))}
          {/* Reference lines for overbought/oversold */}
          {title?.includes('RSI') && (
            <>
              <ReferenceLine y={70} stroke="#ff6b6b" strokeDasharray="3 3" label="Overbought" />
              <ReferenceLine y={30} stroke="#51cf66" strokeDasharray="3 3" label="Oversold" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Combined Price + Volume Chart
export function PriceVolumeChart({ data, title }) {
  return (
    <div style={{ width: '100%', marginTop: 20 }}>
      <h4 style={{ textAlign: 'center', marginBottom: 10 }}>{title || 'Price & Volume'}</h4>

      {/* Price Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="price" stroke="#667eea" fillOpacity={1} fill="url(#colorPrice2)" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="volume" fill="#667eea" opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Render chart based on type
export function ChartRenderer({ code, language }) {
  if (!language?.startsWith('chart-')) return null;

  const chartType = language.replace('chart-', '');
  const data = parseChartData(code, chartType);

  if (!data) return null;

  switch (chartType) {
    case 'stock':
      return <StockChart data={data.data} title={data.title} />;
    case 'volume':
      return <VolumeChart data={data.data} title={data.title} />;
    case 'indicator':
      return <IndicatorChart data={data.data} title={data.title} indicators={data.indicators} />;
    case 'price-volume':
      return <PriceVolumeChart data={data.data} title={data.title} />;
    default:
      return null;
  }
}
