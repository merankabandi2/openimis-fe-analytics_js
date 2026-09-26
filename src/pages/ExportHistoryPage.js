import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { GetApp as DownloadIcon } from '@material-ui/icons';
import { useTranslations, useModulesManager, Helmet, decodeId } from '@openimis/fe-core';
import { fetchExports } from '../actions';
import { DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, RIGHT_ANALYTICS_EXPORT } from '../constants';
import { hasRight, localiseError, pageArgs } from '../utils/analytics';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    maxHeight: 'calc(100vh - 300px)',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
  },
  error: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    color: theme.palette.error.main,
  },
}));

const ExportHistoryPage = ({
  fetchExports,
  exports,
  exportsPageInfo,
  fetchingExports,
  errorExports,
  rights,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations('analytics', modulesManager);
  const allowed = hasRight(rights, RIGHT_ANALYTICS_EXPORT);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (!allowed) return;
    fetchExports(pageArgs({ page, rowsPerPage, orderBy: ['-exportedAt'] }));
  }, [fetchExports, page, rowsPerPage, allowed]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownload = (exportRecord) => {
    // The download route takes the raw UUID, not the Relay id the list returns.
    window.open(`/api/analytics/download/${decodeId(exportRecord.id)}/`, '_blank');
  };

  // GraphQL returns the format choice as an uppercase enum name (EXCEL, CSV).
  const getFormatColor = (format) => {
    switch ((format || '').toLowerCase()) {
      case 'excel':
        return 'primary';
      case 'csv':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!allowed) {
    return (
      <div className={classes.root}>
        <Helmet title={formatMessage('exportHistory.pageTitle')} />
        <Typography variant="body1" color="error" role="alert">
          {formatMessage('exportHistory.noRight')}
        </Typography>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Helmet title={formatMessage('exportHistory.pageTitle')} />
      
      <Box className={classes.header}>
        <Typography variant="h4">
          {formatMessage('exportHistory.title')}
        </Typography>
      </Box>

      {errorExports && (
        <Paper className={classes.error} role="alert">
          <Typography variant="body2">
            {localiseError(errorExports, formatMessage, formatMessageWithValues)}
          </Typography>
        </Paper>
      )}

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={classes.headerCell}>
                {formatMessage('exportHistory.date')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('exportHistory.query')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('exportHistory.format')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('exportHistory.rows')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('exportHistory.exportedBy')}
              </TableCell>
              <TableCell className={classes.headerCell} align="center">
                {formatMessage('exportHistory.download')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exports.map((exportRecord) => (
              <TableRow key={exportRecord.id} hover>
                <TableCell>{formatDateFromISO(exportRecord.exportedAt)}</TableCell>
                <TableCell>
                  {exportRecord.query?.name || formatMessage('exportHistory.adhocQuery')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={exportRecord.exportFormat.toUpperCase()}
                    size="small"
                    color={getFormatColor(exportRecord.exportFormat)}
                  />
                </TableCell>
                <TableCell>{exportRecord.rowCount.toLocaleString()}</TableCell>
                <TableCell>{exportRecord.exportedBy?.username}</TableCell>
                <TableCell align="center">
                  <Tooltip title={formatMessage('exportHistory.downloadFile')}>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(exportRecord)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={exportsPageInfo.totalCount || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={formatMessage('queryResults.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => formatMessageWithValues('pagination.displayedRows', { from, to, count })}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  exports: state.analytics.exports,
  exportsPageInfo: state.analytics.exportsPageInfo,
  fetchingExports: state.analytics.fetchingExports,
  errorExports: state.analytics.errorExports,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  fetchExports,
};

export default connect(mapStateToProps, mapDispatchToProps)(ExportHistoryPage);