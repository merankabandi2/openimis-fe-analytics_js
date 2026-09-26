import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  LinearProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { ROWS_PER_PAGE_OPTIONS } from '../constants';

const useStyles = makeStyles((theme) => ({
  container: {
    maxHeight: 600,
  },
  header: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  executionInfo: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  tableCell: {
    fontSize: '0.875rem',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
  },
  truncated: {
    marginTop: theme.spacing(1),
  },
  noData: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const QueryResults = ({ results, entityType }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations('analytics', modulesManager);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  if (!results) {
    return null;
  }

  // GraphQL returns `data` as a JSONString — parse it back into an array of rows.
  const rawData = results.data;
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      data = [];
    }
  }
  if (!Array.isArray(data)) {
    data = [];
  }
  const {
    rowCount, executionTime, truncated, restrictedRowsWithheld,
  } = results;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? (
        <Chip label={formatMessage('common.yes')} size="small" color="primary" />
      ) : (
        <Chip label={formatMessage('common.no')} size="small" />
      );
    }
    
    if (key && (key.includes('date') || key.includes('Date'))) {
      return formatDateFromISO(value);
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value;
  };

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const paginatedData = data ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];

  return (
    <Box>
      <Box className={classes.header}>
        <Typography variant="h6" gutterBottom>
          {formatMessage('queryResults.title')}
        </Typography>
        <Box className={classes.executionInfo}>
          <Chip
            label={formatMessageWithValues('queryResults.rowCount', { count: rowCount })}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={formatMessageWithValues('queryResults.executionTime', {
              time: executionTime != null ? executionTime.toFixed(2) : '0',
            })}
            variant="outlined"
          />
          <Chip
            label={formatMessage(`entity.${(entityType || '').toLowerCase()}`)}
            variant="outlined"
          />
        </Box>
        {truncated && (
          <Typography variant="body2" color="error" className={classes.truncated}>
            {formatMessageWithValues('queryResults.truncated', { count: rowCount })}
          </Typography>
        )}
        {restrictedRowsWithheld && (
          <Typography variant="body2" color="error" className={classes.truncated} role="alert">
            {formatMessage('queryResults.restrictedRowsWithheld')}
          </Typography>
        )}
      </Box>

      {!data || data.length === 0 ? (
        <Box className={classes.noData}>
          <Typography variant="body1">
            {formatMessage('queryResults.noData')}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer className={classes.container}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      className={`${classes.tableCell} ${classes.headerCell}`}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} hover>
                    {columns.map((column) => (
                      <TableCell key={column} className={classes.tableCell}>
                        {formatValue(row[column], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            component="div"
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={formatMessage('queryResults.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => formatMessageWithValues('pagination.displayedRows', { from, to, count })}
          />
        </>
      )}
    </Box>
  );
};

export default QueryResults;