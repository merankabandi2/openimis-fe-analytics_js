import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@material-ui/icons';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTranslations, useModulesManager, Helmet } from '@openimis/fe-core';
import {
  fetchDashboards, fetchDashboard, executeWidget, updateDashboardLayout,
  createDashboard, updateDashboard, deleteDashboard, deleteWidget,
} from '../actions';
import {
  graphqlErrorMessage, hasRight, layoutPositions, localiseError, pageArgs, parseJson, requestErrorMessage,
  widgetLayout,
} from '../utils/analytics';
import {
  GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN, GRID_CONTAINER_PADDING, RIGHT_ANALYTICS_CREATE_QUERY, RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_DASHBOARD, RIGHT_ANALYTICS_SHARE,
} from '../constants';
import MetricWidget from '../components/widgets/MetricWidget';
import ChartWidget from '../components/widgets/ChartWidget';
import TableWidget from '../components/widgets/TableWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    height: '100vh',
    overflow: 'auto',
  },
  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  dashboardSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  dashboardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  removeWidget: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    zIndex: 1,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
    color: theme.palette.text.secondary,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  widgetContainer: {
    height: '100%',
    position: 'relative',
  },
  error: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    color: theme.palette.error.main,
  },
}));

const AnalyticsDashboardPage = ({
  fetchDashboards,
  fetchDashboard,
  executeWidget,
  updateDashboardLayout,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  deleteWidget,
  dashboards,
  currentDashboard,
  fetchingDashboards,
  fetchingDashboard,
  errorDashboards,
  errorDashboard,
  rights,
  history,
  location,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('analytics', modulesManager);
  const localise = (message) => localiseError(message, formatMessage, formatMessageWithValues);
  const allowed = hasRight(rights, RIGHT_ANALYTICS_VIEW);

  // SavedQueriesPage opens the dashboard it just added a widget to.
  const [selectedDashboardId, setSelectedDashboardId] = useState(
    (location && location.state && location.state.dashboardId) || null,
  );
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const [layout, setLayout] = useState([]);
  const [layoutError, setLayoutError] = useState(null);
  const [breakpoint, setBreakpoint] = useState('lg');
  const [widgetData, setWidgetData] = useState({});
  const [widgetErrors, setWidgetErrors] = useState({});
  const [loadingWidgets, setLoadingWidgets] = useState({});
  // { mode: 'create' | 'edit', name, description, isPublic } while the dashboard dialog is open.
  const [dashboardForm, setDashboardForm] = useState(null);
  const [dashboardFormError, setDashboardFormError] = useState(null);
  const [savingDashboard, setSavingDashboard] = useState(false);
  const [confirmDeleteDashboard, setConfirmDeleteDashboard] = useState(false);
  const [widgetToRemove, setWidgetToRemove] = useState(null);
  const [actionError, setActionError] = useState(null);

  const canCreateDashboard = hasRight(rights, RIGHT_ANALYTICS_CREATE_DASHBOARD);
  const canShare = hasRight(rights, RIGHT_ANALYTICS_SHARE);

  // Fetch available dashboards on mount
  useEffect(() => {
    if (!allowed) return;
    fetchDashboards(pageArgs({ rowsPerPage: 20 }));
  }, [fetchDashboards, allowed]);

  // Set default dashboard
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboardId) {
      const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      setSelectedDashboardId(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboardId]);

  // Fetch selected dashboard details
  useEffect(() => {
    if (selectedDashboardId) {
      fetchDashboard(selectedDashboardId);
    }
  }, [selectedDashboardId, fetchDashboard]);

  const widgets = currentDashboard?.widgets?.edges?.map(({ node }) => node) || [];
  const canEdit = Boolean(currentDashboard?.canEdit);

  // Stored widget positions (a JSON string from GraphQL) define the grid.
  useEffect(() => {
    setLayout(widgets.map(widgetLayout));
    setLayoutError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDashboard]);

  // Load every widget's data through its dashboard, which needs only the
  // dashboards right.
  useEffect(() => {
    widgets.forEach((widget) => {
      if (!widget.query) return;
      setLoadingWidgets((prev) => ({ ...prev, [widget.id]: true }));
      executeWidget(widget.id).then((action) => {
        const error = graphqlErrorMessage(action && action.payload)
          || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
        const result = action && action.payload && action.payload.data
          ? action.payload.data.executeAnalyticsWidget
          : null;
        setWidgetData((prev) => ({ ...prev, [widget.id]: result }));
        setWidgetErrors((prev) => ({ ...prev, [widget.id]: error }));
        setLoadingWidgets((prev) => ({ ...prev, [widget.id]: false }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDashboard, executeWidget]);

  const handleDashboardChange = (dashboardId) => {
    setSelectedDashboardId(dashboardId);
    setDashboardMenuAnchor(null);
  };

  const actionErrorOf = (action) => graphqlErrorMessage(action && action.payload)
    || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);

  const openCreateDashboard = () => {
    setDashboardFormError(null);
    setDashboardForm({
      mode: 'create', name: '', description: '', isPublic: false,
    });
  };

  const openEditDashboard = () => {
    setDashboardFormError(null);
    setDashboardForm({
      mode: 'edit',
      name: currentDashboard.name || '',
      description: currentDashboard.description || '',
      isPublic: Boolean(currentDashboard.isPublic),
    });
  };

  const handleSaveDashboard = async () => {
    const input = {
      name: dashboardForm.name.trim(),
      description: dashboardForm.description,
      // Without the share right the public flag keeps its saved value.
      isPublic: canShare
        ? dashboardForm.isPublic
        : Boolean(dashboardForm.mode === 'edit' && currentDashboard.isPublic),
    };
    setSavingDashboard(true);
    const action = dashboardForm.mode === 'edit'
      ? await updateDashboard(currentDashboard.id, input)
      : await createDashboard(input);
    setSavingDashboard(false);
    const error = actionErrorOf(action);
    if (error) {
      setDashboardFormError(error);
      return;
    }
    const saved = action.payload.data[
      dashboardForm.mode === 'edit' ? 'updateAnalyticsDashboard' : 'createAnalyticsDashboard'
    ].dashboard;
    setDashboardForm(null);
    fetchDashboards(pageArgs({ rowsPerPage: 20 }));
    if (saved.id === selectedDashboardId) {
      fetchDashboard(saved.id);
    } else {
      setSelectedDashboardId(saved.id);
    }
  };

  const handleDeleteDashboard = async () => {
    const action = await deleteDashboard(currentDashboard.id);
    setConfirmDeleteDashboard(false);
    const error = actionErrorOf(action);
    setActionError(error);
    if (error) return;
    setSelectedDashboardId(null);
    fetchDashboards(pageArgs({ rowsPerPage: 20 }));
  };

  const handleRemoveWidget = async () => {
    const action = await deleteWidget(widgetToRemove.id);
    setWidgetToRemove(null);
    const error = actionErrorOf(action);
    setActionError(error);
    if (!error) fetchDashboard(currentDashboard.id);
  };

  // Persist the arrangement once a drag or resize ends (owners with 200004 only).
  // Stored positions are in the 12-column `lg` grid, so only that grid is saved.
  const handleLayoutCommit = async (newLayout) => {
    if (breakpoint !== 'lg') return;
    setLayout(newLayout);
    if (!canEdit || !currentDashboard) return;
    const action = await updateDashboardLayout(currentDashboard.id, layoutPositions(newLayout));
    const error = graphqlErrorMessage(action && action.payload)
      || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
    setLayoutError(error);
  };

  const renderWidget = (widget) => {
    // GraphQL returns `data` as a JSONString; parse it so recharts/table widgets can iterate.
    const rawData = widgetData[widget.id]?.data;
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
    const loading = loadingWidgets[widget.id] || false;
    const rawError = widgetErrors[widget.id] || null;
    const error = rawError ? formatMessageWithValues('widget.error', { error: localise(rawError) }) : null;
    const config = parseJson(widget.config, {}) || {};

    // widget.widgetType comes back as an UPPERCASE Graphene enum ("BAR_CHART"); the
    // widget components switch on the underlying lowercase choice key ("bar_chart").
    const widgetTypeKey = (widget.widgetType || '').toLowerCase();
    switch (widgetTypeKey) {
      case 'metric':
        return (
          <MetricWidget
            title={widget.title}
            data={data}
            config={config}
            loading={loading}
            error={error}
          />
        );
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
        return (
          <ChartWidget
            title={widget.title}
            data={data}
            config={config}
            widgetType={widgetTypeKey}
            loading={loading}
            error={error}
          />
        );
      case 'table':
        return (
          <TableWidget
            title={widget.title}
            data={data}
            config={config}
            loading={loading}
            error={error}
          />
        );
      default:
        return (
          <Paper className={classes.widgetContainer}>
            <Box p={2}>
              <Typography>Unknown widget type: {widget.widgetType}</Typography>
            </Box>
          </Paper>
        );
    }
  };

  if (!allowed) {
    return (
      <div className={classes.root}>
        <Helmet title={formatMessage('dashboard.pageTitle')} />
        <Typography variant="body1" color="error" role="alert">
          {formatMessage('dashboard.noRight')}
        </Typography>
      </div>
    );
  }

  if (fetchingDashboards || (selectedDashboardId && fetchingDashboard)) {
    return (
      <div className={classes.root}>
        <Box className={classes.loading}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Helmet title={formatMessage('dashboard.pageTitle')} />
      
      <Box className={classes.header}>
        <Box className={classes.dashboardSelector}>
          <DashboardIcon />
          <Typography variant="h5">
            {currentDashboard?.name || formatMessage('dashboard.title')}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => setDashboardMenuAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          {canEdit && (
            <Chip
              size="small"
              variant="outlined"
              label={formatMessage(currentDashboard.isPublic ? 'dashboard.public' : 'dashboard.private')}
            />
          )}
        </Box>

        <Box className={classes.dashboardActions}>
          {canEdit && (
            <Tooltip title={formatMessage('dashboard.edit')}>
              <IconButton size="small" onClick={openEditDashboard} aria-label={formatMessage('dashboard.edit')}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && !currentDashboard.isDefault && (
            <Tooltip title={formatMessage('dashboard.delete')}>
              <IconButton
                size="small"
                onClick={() => setConfirmDeleteDashboard(true)}
                aria-label={formatMessage('dashboard.delete')}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
          {canCreateDashboard && (
            <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={openCreateDashboard}>
              {formatMessage('dashboard.create')}
            </Button>
          )}
        </Box>

        <Menu
          anchorEl={dashboardMenuAnchor}
          open={Boolean(dashboardMenuAnchor)}
          onClose={() => setDashboardMenuAnchor(null)}
        >
          {dashboards.map((dashboard) => (
            <MenuItem
              key={dashboard.id}
              onClick={() => handleDashboardChange(dashboard.id)}
              selected={dashboard.id === selectedDashboardId}
            >
              {dashboard.name}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {(errorDashboards || errorDashboard || layoutError || actionError) && (
        <Paper className={classes.error} role="alert">
          <Typography variant="body2">
            {localise(errorDashboards || errorDashboard)
              || (layoutError && formatMessageWithValues('dashboard.layoutError', { error: localise(layoutError) }))
              || formatMessageWithValues('dashboard.actionError', { error: localise(actionError) })}
          </Typography>
        </Paper>
      )}

      {widgets.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: GRID_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={GRID_ROW_HEIGHT}
          margin={GRID_MARGIN}
          containerPadding={GRID_CONTAINER_PADDING}
          onBreakpointChange={setBreakpoint}
          onDragStop={handleLayoutCommit}
          onResizeStop={handleLayoutCommit}
          isDraggable={canEdit && breakpoint === 'lg'}
          isResizable={canEdit && breakpoint === 'lg'}
          draggableCancel=".analytics-remove-widget"
        >
          {widgets.map((widget) => (
            <div key={widget.id} className={classes.widgetContainer}>
              {canEdit && (
                <IconButton
                  size="small"
                  className={`${classes.removeWidget} analytics-remove-widget`}
                  onClick={() => setWidgetToRemove(widget)}
                  aria-label={formatMessage('dashboard.removeWidget')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <Box className={classes.emptyState}>
          <Typography variant="h6" gutterBottom>
            {formatMessage('dashboard.noWidgets')}
          </Typography>
          {currentDashboard && (
            <Typography variant="body2">
              {formatMessage(canEdit ? 'dashboard.addWidgetsHint' : 'dashboard.noWidgetsViewer')}
            </Typography>
          )}
        </Box>
      )}

      <Dialog open={Boolean(dashboardForm)} onClose={() => setDashboardForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formatMessage(dashboardForm && dashboardForm.mode === 'edit' ? 'dashboard.editTitle' : 'dashboard.createTitle')}
        </DialogTitle>
        {dashboardForm && (
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label={formatMessage('dashboard.name')}
                value={dashboardForm.name}
                onChange={(e) => setDashboardForm({ ...dashboardForm, name: e.target.value })}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label={formatMessage('dashboard.description')}
                value={dashboardForm.description}
                onChange={(e) => setDashboardForm({ ...dashboardForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              {canShare && (
                <FormControlLabel
                  control={(
                    <Switch
                      checked={dashboardForm.isPublic}
                      onChange={(e) => setDashboardForm({ ...dashboardForm, isPublic: e.target.checked })}
                    />
                  )}
                  label={formatMessage('dashboard.makePublic')}
                />
              )}
              {dashboardFormError && (
                <Typography variant="body2" color="error" role="alert">
                  {formatMessageWithValues('dashboard.saveError', { error: localise(dashboardFormError) })}
                </Typography>
              )}
            </Box>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDashboardForm(null)}>{formatMessage('common.cancel')}</Button>
          <Button
            onClick={handleSaveDashboard}
            color="primary"
            variant="contained"
            disabled={!dashboardForm || !dashboardForm.name.trim() || savingDashboard}
          >
            {formatMessage('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteDashboard} onClose={() => setConfirmDeleteDashboard(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{formatMessage('dashboard.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {formatMessageWithValues('dashboard.deleteConfirm', { name: currentDashboard?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDashboard(false)}>{formatMessage('common.cancel')}</Button>
          <Button onClick={handleDeleteDashboard} color="primary" variant="contained">
            {formatMessage('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(widgetToRemove)} onClose={() => setWidgetToRemove(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{formatMessage('dashboard.removeWidget')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {formatMessageWithValues('dashboard.removeWidgetConfirm', { title: widgetToRemove?.title || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWidgetToRemove(null)}>{formatMessage('common.cancel')}</Button>
          <Button onClick={handleRemoveWidget} color="primary" variant="contained">
            {formatMessage('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {hasRight(rights, RIGHT_ANALYTICS_CREATE_QUERY) && (
        <Fab
          className={classes.fab}
          color="primary"
          onClick={() => history.push('/analytics/query-builder')}
        >
          <AddIcon />
        </Fab>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  dashboards: state.analytics.dashboards,
  currentDashboard: state.analytics.currentDashboard,
  fetchingDashboards: state.analytics.fetchingDashboards,
  fetchingDashboard: state.analytics.fetchingDashboard,
  errorDashboards: state.analytics.errorDashboards,
  errorDashboard: state.analytics.errorDashboard,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  fetchDashboards,
  fetchDashboard,
  executeWidget,
  updateDashboardLayout,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  deleteWidget,
};

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsDashboardPage);