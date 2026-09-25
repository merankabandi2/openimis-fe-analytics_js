import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

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
}));

const MetricWidget = ({ title, data, config = {}, loading, error }) => {
  const classes = useStyles();

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

  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {error ? (
          <Typography variant="body2" color="error">{error}</Typography>
        ) : (
          <Typography className={classes.metric}>
            {config.prefix}{formattedValue}{config.suffix}
          </Typography>
        )}
        {config.label && (
          <Typography variant="body2" className={classes.label}>
            {config.label}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricWidget;