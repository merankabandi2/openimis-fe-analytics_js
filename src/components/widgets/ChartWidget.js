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
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { CHART_COLORS } from '../../constants';
import {
  chartDisplay, pickChartKeys, shortLabel, withCategoryLabels,
} from '../../utils/analytics';

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

const ChartWidget = ({ title, data, config = {}, widgetType, loading, error }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);
  const display = chartDisplay(config, widgetType);
  const emptyCategory = formatMessage('widget.emptyCategory');

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
    if (error) {
      return (
        <Box className={classes.loading}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      );
    }
    if (!data || data.length === 0) {
      return (
        <Box className={classes.loading}>
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

  // Every category gets a tick; long labels are slanted and shortened, and the
  // tooltip shows the full label.
  const renderBarChart = () => {
    const { valueKey: dataKey, categoryKey } = pickChartKeys(data, config, 'xAxisKey');

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={withCategoryLabels(data, categoryKey, emptyCategory)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={categoryKey}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={90}
            tick={{ fontSize: 11 }}
            tickFormatter={shortLabel}
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
    <Card className={classes.root}>
      <CardHeader title={title} />
      <CardContent className={classes.content}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartWidget;