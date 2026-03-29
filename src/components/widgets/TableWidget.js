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
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { formatDateFromISO } from '@openimis/fe-core';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    padding: 0,
  },
  tableContainer: {
    height: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: theme.spacing(3),
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
  },
  noData: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const TableWidget = ({ title, data, config, loading }) => {
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

  if (!data || data.length === 0) {
    return (
      <Card className={classes.root}>
        <CardHeader title={title} />
        <CardContent className={classes.noData}>
          <Typography variant="body2">No data available</Typography>
        </CardContent>
      </Card>
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
    <Card className={classes.root}>
      <CardHeader title={title} />
      <CardContent className={classes.content}>
        <TableContainer className={classes.tableContainer}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column} className={classes.headerCell}>
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
  );
};

export default TableWidget;