import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Box,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
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
import { CHART_COLORS } from '../../constants';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
}));

const ChartWidget = ({ title, data, config, widgetType, loading }) => {
  const classes = useStyles();

  if (loading) {
    return (
      <Card className={classes.root}>
        <CardContent className={classes.loading}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <Box className={classes.loading}>
          <Typography variant="body2" color="textSecondary">
            No data available
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

  const renderBarChart = () => {
    const dataKey = config.dataKey || Object.keys(data[0]).find(key => key !== config.xAxisKey);
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.xAxisKey || Object.keys(data[0])[0]} />
          <YAxis />
          <Tooltip />
          {config.showLegend && <Legend />}
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
    const dataKey = config.dataKey || Object.keys(data[0]).find(key => key !== config.xAxisKey);
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.xAxisKey || Object.keys(data[0])[0]} />
          <YAxis />
          <Tooltip />
          {config.showLegend && <Legend />}
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
    const dataKey = config.dataKey || Object.keys(data[0]).find(key => key !== config.nameKey);
    const nameKey = config.nameKey || Object.keys(data[0])[0];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={config.showLabels}
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
          {config.showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={classes.root}>
      <CardHeader title={title} />
      <CardContent className={classes.content}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartWidget;