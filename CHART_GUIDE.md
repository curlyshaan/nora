# Nora Chart Generation Guide

## Overview
Nora can now generate interactive charts to teach investing concepts visually!

## Available Chart Types

### 1. Stock Price Chart
Shows price movements over time with a beautiful gradient area chart.

**Usage:**
```chart-stock
{
  "title": "AAPL Stock Price - Last 30 Days",
  "data": [
    {"date": "Jan 1", "price": 150},
    {"date": "Jan 8", "price": 155},
    {"date": "Jan 15", "price": 160},
    {"date": "Jan 22", "price": 158},
    {"date": "Jan 29", "price": 165}
  ]
}
```

### 2. Volume Chart
Shows trading volume as bar charts.

**Usage:**
```chart-volume
{
  "title": "Trading Volume",
  "data": [
    {"date": "Mon", "volume": 1000000},
    {"date": "Tue", "volume": 1200000},
    {"date": "Wed", "volume": 800000},
    {"date": "Thu", "volume": 1500000},
    {"date": "Fri", "volume": 900000}
  ]
}
```

### 3. Technical Indicator Chart
Shows RSI, MACD, Moving Averages, etc.

**Usage:**
```chart-indicator
{
  "title": "RSI - Relative Strength Index",
  "data": [
    {"date": "Jan 1", "rsi": 45},
    {"date": "Jan 8", "rsi": 55},
    {"date": "Jan 15", "rsi": 65},
    {"date": "Jan 22", "rsi": 75},
    {"date": "Jan 29", "rsi": 68}
  ],
  "indicators": [
    {"key": "rsi", "name": "RSI", "color": "#667eea"}
  ]
}
```

**Multiple Indicators:**
```chart-indicator
{
  "title": "Moving Averages",
  "data": [
    {"date": "Jan 1", "price": 150, "ma20": 148, "ma50": 145},
    {"date": "Jan 8", "price": 155, "ma20": 150, "ma50": 147},
    {"date": "Jan 15", "price": 160, "ma20": 153, "ma50": 149}
  ],
  "indicators": [
    {"key": "price", "name": "Price", "color": "#667eea"},
    {"key": "ma20", "name": "20-day MA", "color": "#ff6b6b"},
    {"key": "ma50", "name": "50-day MA", "color": "#51cf66"}
  ]
}
```

### 4. Combined Price + Volume Chart
Shows both price and volume in one view.

**Usage:**
```chart-price-volume
{
  "title": "TSLA - Price & Volume Analysis",
  "data": [
    {"date": "Jan 1", "price": 250, "volume": 2000000},
    {"date": "Jan 8", "price": 260, "volume": 2500000},
    {"date": "Jan 15", "price": 255, "volume": 1800000},
    {"date": "Jan 22", "price": 270, "volume": 3000000}
  ]
}
```

## Example Teaching Scenarios

### Teaching Chart Patterns
Ask: "Show me what a head and shoulders pattern looks like"

Nora can generate:
```chart-stock
{
  "title": "Head and Shoulders Pattern",
  "data": [
    {"date": "Week 1", "price": 100},
    {"date": "Week 2", "price": 110},
    {"date": "Week 3", "price": 105},
    {"date": "Week 4", "price": 115},
    {"date": "Week 5", "price": 105},
    {"date": "Week 6", "price": 110},
    {"date": "Week 7", "price": 95}
  ]
}
```

### Teaching RSI Overbought/Oversold
Ask: "Explain RSI with an example"

Nora can show RSI crossing 70 (overbought) and 30 (oversold) levels with reference lines.

### Teaching Volume Analysis
Ask: "How does volume confirm price movements?"

Nora can show price increasing with volume increasing (bullish confirmation).

## How It Works

1. **AI generates chart data** in JSON format within special code blocks
2. **Frontend detects** `chart-*` language tags
3. **ChartRenderer component** parses JSON and renders interactive Recharts
4. **User sees beautiful charts** that help visualize concepts

## Benefits

✅ Visual learning - easier to understand patterns
✅ Interactive - hover to see exact values
✅ Professional looking - matches dark/light theme
✅ Educational - perfect for teaching technical analysis
✅ Real-time - AI can generate charts on the fly

## Try It!

Ask Nora:
- "Show me what a bullish trend looks like with a chart"
- "Explain RSI with a visual example"
- "Draw a chart showing support and resistance levels"
- "Visualize what happens when volume dries up"
- "Show me a chart pattern for a breakout"

Nora will generate beautiful, interactive charts to teach you!
