import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslations, useModulesManager } from '@openimis/fe-core';

const StyledTableWidget = styled('div')(({ theme }) => ({
  display: 'contents',

  '& .TableWidget-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  '& .TableWidget-content': {
    flex: 1,
    padding: 0,
  },

  '& .TableWidget-tableContainer': {
    height: '100%',
  },

  '& .TableWidget-loading': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: theme.spacing(3),
  },

  '& .TableWidget-headerCell': {
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
  },

  '& .TableWidget-noData': {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
}));

const TableWidget = ({ title, data, config, loading, error }) => {
  const modulesManager = useModulesManager();
  const { formatMessage, formatDateFromISO } = useTranslations('analytics', modulesManager);

  if (loading) {
    return (
      <StyledTableWidget>
        <Card className='TableWidget-root'>
          <CardContent className='TableWidget-loading'>
            <CircularProgress />
          </CardContent>
        </Card>
      </StyledTableWidget>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <StyledTableWidget>
        <Card className='TableWidget-root'>
          <CardHeader title={title} />
          <CardContent className='TableWidget-noData'>
            <Typography variant="body2" color={error ? 'error' : 'inherit'}>
              {error || formatMessage('widget.noData')}
            </Typography>
          </CardContent>
        </Card>
      </StyledTableWidget>
    );
  }

  const columns = config.columns || Object.keys(data[0]);
  const maxRows = config.maxRows || 10;
  const displayData = data.slice(0, maxRows);

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (column.includes('date') || column.includes('Date')) {
      return formatDateFromISO(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number' && config.numberFormat) {
      return new Intl.NumberFormat('en-US', config.numberFormat).format(value);
    }
    
    return value;
  };

  return (
    <StyledTableWidget>
      <Card className='TableWidget-root'>
        <CardHeader title={title} />
        <CardContent className='TableWidget-content'>
          <TableContainer className='TableWidget-tableContainer'>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column} className='TableWidget-headerCell'>
                      {config.columnLabels?.[column] || column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.map((row, index) => (
                  <TableRow key={index} hover>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {formatCellValue(row[column], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </StyledTableWidget>
  );
};

export default TableWidget;