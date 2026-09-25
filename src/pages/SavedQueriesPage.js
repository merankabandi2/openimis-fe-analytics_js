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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  PlayArrow as RunIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@material-ui/icons';
import { useTranslations, useModulesManager, Helmet } from '@openimis/fe-core';
import { fetchQueries, deleteQuery } from '../actions';
import {
  DEFAULT_PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  RIGHT_ANALYTICS_UPDATE_QUERY,
} from '../constants';
import {
  graphqlErrorMessage, hasRight, pageArgs, parseJson, requestErrorMessage,
} from '../utils/analytics';

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
  actions: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  publicChip: {
    marginLeft: theme.spacing(1),
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  error: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    color: theme.palette.error.main,
  },
}));

const SavedQueriesPage = ({
  fetchQueries,
  deleteQuery,
  queries,
  queriesPageInfo,
  fetchingQueries,
  errorQueries,
  rights,
  history,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations('analytics', modulesManager);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_PAGE_SIZE);
  const [queryToDelete, setQueryToDelete] = React.useState(null);
  const [deleteError, setDeleteError] = React.useState(null);
  const canUpdate = hasRight(rights, RIGHT_ANALYTICS_UPDATE_QUERY);

  const loadPage = React.useCallback(() => {
    fetchQueries(pageArgs({ page, rowsPerPage, orderBy: ['-validityFrom'] }));
  }, [fetchQueries, page, rowsPerPage]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Normalise the entity type the API returns (GraphQL auto-uppercases enum values from
  // the Django choices field) into the lowercase form the builder UI and translations use.
  const normaliseEntityType = (et) => (et || '').toLowerCase();

  const handleRunQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        entityType: normaliseEntityType(query.entityType),
        queryConfig: parseJson(query.queryConfig, {}),
        autoRun: true,
      },
    });
  };

  const handleEditQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        queryId: query.id,
        entityType: normaliseEntityType(query.entityType),
        queryConfig: parseJson(query.queryConfig, {}),
        queryName: query.name,
        queryDescription: query.description,
        isPublic: query.isPublic,
      },
    });
  };

  const handleCopyQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        entityType: normaliseEntityType(query.entityType),
        queryConfig: parseJson(query.queryConfig, {}),
        queryName: `${query.name} (Copie)`,
        queryDescription: query.description,
        isPublic: false,
      },
    });
  };

  const handleDeleteQuery = (query) => {
    setDeleteError(null);
    setQueryToDelete(query);
  };

  const handleConfirmDelete = async () => {
    const action = await deleteQuery(queryToDelete.id);
    const error = graphqlErrorMessage(action && action.payload)
      || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
    if (error) {
      setDeleteError(error);
      return;
    }
    setQueryToDelete(null);
    loadPage();
  };

  const handleCreateNew = () => {
    history.push('/analytics/query-builder');
  };

  return (
    <div className={classes.root}>
      <Helmet title={formatMessage('savedQueries.pageTitle')} />
      
      <Box className={classes.header}>
        <Typography variant="h4">
          {formatMessage('savedQueries.title')}
        </Typography>
      </Box>

      {errorQueries && (
        <Paper className={classes.error} role="alert">
          <Typography variant="body2">{errorQueries}</Typography>
        </Paper>
      )}

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.name')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.entityType')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.createdBy')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.dateCreated')}
              </TableCell>
              <TableCell className={classes.headerCell} align="center">
                {formatMessage('savedQueries.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query.id} hover>
                <TableCell>
                  {query.name}
                  {query.isPublic && (
                    <Chip
                      label={formatMessage('savedQueries.public')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      className={classes.publicChip}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {/* GraphQL returns enum choices UPPERCASE; translation keys are lowercase */}
                  {formatMessage(`entity.${(query.entityType || '').toLowerCase()}`)}
                </TableCell>
                <TableCell>{query.createdBy?.username}</TableCell>
                <TableCell>{formatDateFromISO(query.validityFrom)}</TableCell>
                <TableCell>
                  <Box className={classes.actions}>
                    <Tooltip title={formatMessage('savedQueries.run')}>
                      <IconButton
                        size="small"
                        onClick={() => handleRunQuery(query)}
                      >
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                    {canUpdate && (
                      <Tooltip title={formatMessage('savedQueries.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditQuery(query)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={formatMessage('savedQueries.copy')}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyQuery(query)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    {canUpdate && (
                      <Tooltip title={formatMessage('savedQueries.delete')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteQuery(query)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={queriesPageInfo.totalCount || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={formatMessage('queryResults.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => formatMessageWithValues('pagination.displayedRows', { from, to, count })}
      />

      <Dialog open={Boolean(queryToDelete)} onClose={() => setQueryToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{formatMessage('savedQueries.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {formatMessageWithValues('savedQueries.deleteConfirm', { name: queryToDelete?.name || '' })}
          </Typography>
          {deleteError && (
            <Typography variant="body2" color="error" role="alert">
              {formatMessageWithValues('savedQueries.deleteError', { error: deleteError })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryToDelete(null)}>{formatMessage('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="primary" variant="contained">
            {formatMessage('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        className={classes.fab}
        color="primary"
        onClick={handleCreateNew}
      >
        <AddIcon />
      </Fab>
    </div>
  );
};

const mapStateToProps = (state) => ({
  queries: state.analytics.queries,
  queriesPageInfo: state.analytics.queriesPageInfo,
  fetchingQueries: state.analytics.fetchingQueries,
  errorQueries: state.analytics.errorQueries,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  fetchQueries,
  deleteQuery,
};

export default connect(mapStateToProps, mapDispatchToProps)(SavedQueriesPage);