import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TrendingUp, TrendingDown, TrendingFlat } from '@material-ui/icons';
import { useTranslations, useModulesManager } from '@openimis/fe-core';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  metric: {
    fontSize: '3rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
    lineHeight: 1,
  },
  label: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  trend: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(2),
  },
  trendUp: {
    color: theme.palette.success.main,
  },
  trendDown: {
    color: theme.palette.error.main,
  },
  trendFlat: {
    color: theme.palette.text.secondary,
  },
}));

const MetricWidget = ({ title, data, config, loading }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  if (loading) {
    return (
      <Card className={classes.root}>
        <CardContent className={classes.content}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  const value = data && data.length > 0 ? data[0][Object.keys(data[0])[0]] : 0;
  const formattedValue = formatValue(value, config);
  const trend = config.showTrend ? calculateTrend(data, config) : null;

  function formatValue(val, cfg) {
    if (cfg.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cfg.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    
    if (cfg.format === 'percentage') {
      return `${(val * 100).toFixed(1)}%`;
    }
    
    if (cfg.format === 'number') {
      return new Intl.NumberFormat('en-US').format(val);
    }
    
    return val;
  }

  function calculateTrend(data, cfg) {
    // This would calculate trend based on historical data if available
    // For now, return a mock trend
    return {
      direction: 'up',
      value: 12.5,
    };
  }

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className={classes.trendUp} />;
      case 'down':
        return <TrendingDown className={classes.trendDown} />;
      default:
        return <TrendingFlat className={classes.trendFlat} />;
    }
  };

  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography className={classes.metric}>
          {config.prefix}{formattedValue}{config.suffix}
        </Typography>
        {config.label && (
          <Typography variant="body2" className={classes.label}>
            {config.label}
          </Typography>
        )}
        {trend && (
          <Box className={classes.trend}>
            {getTrendIcon(trend.direction)}
            <Typography
              variant="body2"
              className={
                trend.direction === 'up'
                  ? classes.trendUp
                  : trend.direction === 'down'
                  ? classes.trendDown
                  : classes.trendFlat
              }
            >
              {trend.value}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricWidget;