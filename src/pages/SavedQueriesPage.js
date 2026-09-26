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
  TextField,
  MenuItem,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  PlayArrow as RunIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlaylistAdd as AddToDashboardIcon,
} from '@material-ui/icons';
import { useTranslations, useModulesManager, Helmet } from '@openimis/fe-core';
import {
  fetchQueries, deleteQuery, fetchDashboards, addWidget,
} from '../actions';
import {
  DEFAULT_PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_CREATE_DASHBOARD,
  WIDGET_TYPES,
} from '../constants';
import {
  graphqlErrorMessage, hasRight, localiseError, pageArgs, parseJson, requestErrorMessage,
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

// Widget types the dashboard page draws.
const ADDABLE_WIDGET_TYPES = [
  WIDGET_TYPES.BAR_CHART, WIDGET_TYPES.LINE_CHART, WIDGET_TYPES.PIE_CHART, WIDGET_TYPES.TABLE, WIDGET_TYPES.METRIC,
];

const SavedQueriesPage = ({
  fetchQueries,
  deleteQuery,
  fetchDashboards,
  addWidget,
  queries,
  queriesPageInfo,
  fetchingQueries,
  errorQueries,
  dashboards,
  fetchingDashboards,
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
  const localise = (message) => localiseError(message, formatMessage, formatMessageWithValues);
  const allowed = hasRight(rights, RIGHT_ANALYTICS_CREATE_QUERY);
  const canAddToDashboard = hasRight(rights, RIGHT_ANALYTICS_CREATE_DASHBOARD);
  // { query, dashboardId, widgetType, title } while the add-to-dashboard dialog is open.
  const [widgetForm, setWidgetForm] = React.useState(null);
  const [widgetError, setWidgetError] = React.useState(null);
  const [addingWidget, setAddingWidget] = React.useState(false);
  const editableDashboards = (dashboards || []).filter((d) => d.canEdit);

  const loadPage = React.useCallback(() => {
    fetchQueries(pageArgs({ page, rowsPerPage, orderBy: ['-validityFrom'] }));
  }, [fetchQueries, page, rowsPerPage]);

  useEffect(() => {
    if (!allowed) return;
    loadPage();
  }, [loadPage, allowed]);

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

  const handleOpenAddToDashboard = (query) => {
    setWidgetError(null);
    setWidgetForm({
      query, dashboardId: '', widgetType: WIDGET_TYPES.BAR_CHART, title: query.name || '',
    });
    fetchDashboards(pageArgs({ rowsPerPage: 100 }));
  };

  const handleConfirmAddToDashboard = async () => {
    setAddingWidget(true);
    const action = await addWidget(
      widgetForm.dashboardId, widgetForm.query.id, widgetForm.widgetType, widgetForm.title.trim(),
    );
    setAddingWidget(false);
    const error = graphqlErrorMessage(action && action.payload)
      || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
    if (error) {
      setWidgetError(error);
      return;
    }
    history.push({ pathname: '/analytics/dashboard', state: { dashboardId: widgetForm.dashboardId } });
  };

  if (!allowed) {
    return (
      <div className={classes.root}>
        <Helmet title={formatMessage('savedQueries.pageTitle')} />
        <Typography variant="body1" color="error" role="alert">
          {formatMessage('savedQueries.noRight')}
        </Typography>
      </div>
    );
  }

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
          <Typography variant="body2">{localise(errorQueries)}</Typography>
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
                    {query.canEdit && (
                      <Tooltip title={formatMessage('savedQueries.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditQuery(query)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canAddToDashboard && (
                      <Tooltip title={formatMessage('savedQueries.addToDashboard')}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAddToDashboard(query)}
                          aria-label={formatMessage('savedQueries.addToDashboard')}
                        >
                          <AddToDashboardIcon />
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
                    {query.canEdit && (
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
              {formatMessageWithValues('savedQueries.deleteError', { error: localise(deleteError) })}
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

      <Dialog open={Boolean(widgetForm)} onClose={() => setWidgetForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{formatMessage('savedQueries.addToDashboardTitle')}</DialogTitle>
        {widgetForm && (
          <DialogContent>
            {!fetchingDashboards && editableDashboards.length === 0 ? (
              <Typography variant="body2">{formatMessage('savedQueries.noEditableDashboard')}</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2} mt={1}>
                <TextField
                  select
                  label={formatMessage('savedQueries.dashboard')}
                  value={widgetForm.dashboardId}
                  onChange={(e) => setWidgetForm({ ...widgetForm, dashboardId: e.target.value })}
                  fullWidth
                  required
                >
                  {editableDashboards.map((dashboard) => (
                    <MenuItem key={dashboard.id} value={dashboard.id}>{dashboard.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={formatMessage('savedQueries.widgetType')}
                  value={widgetForm.widgetType}
                  onChange={(e) => setWidgetForm({ ...widgetForm, widgetType: e.target.value })}
                  fullWidth
                >
                  {ADDABLE_WIDGET_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{formatMessage(`widgetType.${type}`)}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={formatMessage('savedQueries.widgetTitle')}
                  value={widgetForm.title}
                  onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                  fullWidth
                  required
                />
              </Box>
            )}
            {widgetError && (
              <Typography variant="body2" color="error" role="alert">
                {formatMessageWithValues('savedQueries.addToDashboardError', { error: localise(widgetError) })}
              </Typography>
            )}
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setWidgetForm(null)}>{formatMessage('common.cancel')}</Button>
          <Button
            onClick={handleConfirmAddToDashboard}
            color="primary"
            variant="contained"
            disabled={!widgetForm || !widgetForm.dashboardId || !widgetForm.title.trim() || addingWidget}
          >
            {formatMessage('savedQueries.addToDashboardConfirm')}
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
  dashboards: state.analytics.dashboards,
  fetchingDashboards: state.analytics.fetchingDashboards,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  fetchQueries,
  deleteQuery,
  fetchDashboards,
  addWidget,
};

export default connect(mapStateToProps, mapDispatchToProps)(SavedQueriesPage);