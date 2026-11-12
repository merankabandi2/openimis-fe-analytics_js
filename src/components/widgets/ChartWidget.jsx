import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { CHART_COLORS } from '../../constants';
import {
  axisTickFormatter, chartDisplay, pickChartKeys, withCategoryLabels,
} from '../../utils/analytics';

const StyledChartWidget = styled('div')(({ theme }) => ({
  display: 'contents',

  '& .ChartWidget-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  '& .ChartWidget-content': {
    flex: 1,
    minHeight: 300,
  },

  '& .ChartWidget-loading': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  }
}));

const ChartWidget = ({ title, data, config = {}, widgetType, loading, error }) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);
  const display = chartDisplay(config, widgetType);
  const emptyCategory = formatMessage('widget.emptyCategory');

  if (loading) {
    return (
      <StyledChartWidget>
        <Card className='ChartWidget-root'>
          <CardContent className='ChartWidget-loading'>
            <CircularProgress />
          </CardContent>
        </Card>
      </StyledChartWidget>
    );
  }

  const renderChart = () => {
    if (error) {
      return (
        <Box className='ChartWidget-loading'>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      );
    }
    if (!data || data.length === 0) {
      return (
        <Box className='ChartWidget-loading'>
          <Typography variant="body2" color="textSecondary">
            {formatMessage('widget.noData')}
          </Typography>
        </Box>
      );
    }

    switch (widgetType) {
      case 'bar_chart':
        return renderBarChart();
      case 'line_chart':
        return renderLineChart();
      case 'pie_chart':
        return renderPieChart();
      default:
        return null;
    }
  };

  // Every category gets its own tick; long labels are slanted and shortened
  // without two categories sharing a tick text, and the tooltip shows the full label.
  const renderBarChart = () => {
    const { valueKey: dataKey, categoryKey } = pickChartKeys(data, config, 'xAxisKey');
    const rows = withCategoryLabels(data, categoryKey, emptyCategory);
    const tickFormatter = axisTickFormatter(rows.map((row) => row[categoryKey]));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={categoryKey}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={90}
            tick={{ fontSize: 11 }}
            tickFormatter={tickFormatter}
          />
          <YAxis />
          <Tooltip />
          {display.legend && <Legend />}
          <Bar
            dataKey={dataKey}
            fill={config.color || CHART_COLORS[0]}
            name={config.barLabel || dataKey}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    const { valueKey: dataKey, categoryKey } = pickChartKeys(data, config, 'xAxisKey');

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={withCategoryLabels(data, categoryKey, emptyCategory)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} />
          <YAxis />
          <Tooltip />
          {display.legend && <Legend />}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={config.color || CHART_COLORS[0]}
            name={config.lineLabel || dataKey}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    const { valueKey: dataKey, categoryKey: nameKey } = pickChartKeys(data, config, 'nameKey');

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={withCategoryLabels(data, nameKey, emptyCategory)}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={display.labels}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {display.legend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <StyledChartWidget>
      <Card className='ChartWidget-root'>
        <CardHeader title={title} />
        <CardContent className='ChartWidget-content'>
          {renderChart()}
        </CardContent>
      </Card>
    </StyledChartWidget>
  );
};

export default ChartWidget;