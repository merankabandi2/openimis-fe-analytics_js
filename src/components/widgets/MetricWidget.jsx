import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledMetricWidget = styled('div')(({ theme }) => ({
  display: 'contents',

  '& .MetricWidget-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  '& .MetricWidget-content': {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  '& .MetricWidget-metric': {
    fontSize: '3rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
    lineHeight: 1,
  },

  '& .MetricWidget-label': {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  }
}));

const MetricWidget = ({ title, data, config = {}, loading, error }) => {
  if (loading) {
    return (
      <StyledMetricWidget>
        <Card className='MetricWidget-root'>
          <CardContent className='MetricWidget-content'>
            <CircularProgress />
          </CardContent>
        </Card>
      </StyledMetricWidget>
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
    <StyledMetricWidget>
      <Card className='MetricWidget-root'>
        <CardContent className='MetricWidget-content'>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {error ? (
            <Typography variant="body2" color="error">{error}</Typography>
          ) : (
            <Typography className='MetricWidget-metric'>
              {config.prefix}{formattedValue}{config.suffix}
            </Typography>
          )}
          {config.label && (
            <Typography variant="body2" className='MetricWidget-label'>
              {config.label}
            </Typography>
          )}
        </CardContent>
      </Card>
    </StyledMetricWidget>
  );
};

export default MetricWidget;